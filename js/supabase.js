/* ============================================
   SUPABASE CLIENT INITIALIZATION
   
   SETUP INSTRUCTIONS:
   1. Create a Supabase project at https://supabase.com
   2. Get your Project URL and Public Anon Key from Settings > API
   3. Replace the placeholder credentials below
   4. Load Supabase library: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   5. Run the schema.sql from supabase/schema.sql in the Supabase SQL Editor
   6. Enable Row Level Security (RLS) on all tables
   7. Set up authentication policies in Supabase
   
   Production Checklist:
   - Use service role key for server-side operations only
   - Implement RLS policies for data security
   - Set up email templates for notifications
   - Configure OAuth providers if needed
   - Enable audit logging
   - Set up backups
   ============================================ */

var SUPABASE_CONFIG = {
  // PRODUCTION: Replace these with your actual credentials
  url: (typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env && globalThis.process.env.VITE_SUPABASE_URL)
    || 'https://woajkhjvbctcthqcxlqe.supabase.co',
  anonKey: (typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env && globalThis.process.env.VITE_SUPABASE_ANON_KEY)
    || 'sb_publishable_xphWnQqNOkcN982mrAkc2A_-oEz1X6a'
};

// Detect if Supabase library is available (loaded via CDN in HTML)
var supabaseClient = null;
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('[NBA Lokoja] Supabase client initialized successfully');
  } catch (err) {
    console.warn('[NBA Lokoja] Supabase initialization failed:', err.message);
  }
}

/* ============================================
   AUTH HELPERS
   ============================================ */

var NBAAuth = {
  /** Sign up new member */
  async signUp({
    email, password, firstName, middleName, lastName, title, rank,
    yearCalled, scn, gender, phone, organizationName, address
  }) {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Authentication service is unavailable. Please check your Supabase configuration.' } };
    }
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    try {
      // Generate membership number
      const { data: seqData, error: seqError } = await supabaseClient.rpc('nextval', { seq_name: 'membership_number_seq' });
      const membershipNumber = seqError ? ('NBA-LOC-' + Date.now().toString().slice(-4)) : ('NBA-LOC-' + String(seqData).padStart(4, '0'));

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            title,
            rank,
            year_called: yearCalled,
            scn_number: scn,
            gender,
            phone,
            organization_name: organizationName,
            address,
            membership_number: membershipNumber,
            role: 'member',
            status: 'pending'
          }
        }
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /** Sign in member */
  async signIn(identifier, password) {
    if (!supabaseClient) {
      return { data: null, error: { message: 'Authentication service is unavailable. Please check your Supabase configuration.' } };
    }
    try {
      const isEmail = identifier.includes('@');
      let email = identifier.trim();
      if (!isEmail) {
        const { data: lookup, error: lookupError } = await supabaseClient.rpc('resolve_login_email', {
          login_identifier: identifier.trim()
        });
        if (lookupError || !lookup) {
          return { data: null, error: lookupError || { message: 'No account found for that Supreme Court Number.' } };
        }
        email = lookup;
      }
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        const raw = String(error.message || '').toLowerCase();
        if (raw.includes('email not confirmed')) {
          return { data: null, error: { ...error, message: 'Email not verified. Please confirm your email before signing in.' } };
        }
        const invalidCreds = raw.includes('invalid login credentials')
          || raw.includes('invalid_credentials')
          || raw.includes('invalid email or password');
        if (invalidCreds) {
          return { data: null, error: { ...error, message: 'Invalid email or password.' } };
        }
      }
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /** Sign out */
  async signOut() {
    if (!supabaseClient) return { error: null };
    return supabaseClient.auth.signOut();
  },

  /** Reset password */
  async resetPassword(email) {
    if (!supabaseClient) return { data: null, error: { message: 'Authentication service is unavailable. Please check your Supabase configuration.' } };
    const redirectUrl = new URL('/portal/reset-password.html', window.location.href).href;
    return supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
  },

  /** Resend signup verification email */
  async resendConfirmationEmail(email) {
    if (!supabaseClient) return { data: null, error: { message: 'Authentication service is unavailable. Please check your Supabase configuration.' } };
    if (!email) return { data: null, error: { message: 'Email address is required.' } };
    const emailRedirectTo = new URL('/portal/login.html?verified=1', window.location.href).href;
    return supabaseClient.auth.resend({
      type: 'signup',
      email: email,
      options: { emailRedirectTo: emailRedirectTo }
    });
  },

  /** Get current session */
  async getSession() {
    if (!supabaseClient) return { data: { session: null }, error: { message: 'Authentication service is unavailable.' } };
    return supabaseClient.auth.getSession();
  },

  /** Listen to auth state */
  onAuthChange(callback) {
    if (!supabaseClient) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabaseClient.auth.onAuthStateChange(callback);
  }
};

/* ============================================
   DATABASE HELPERS
   ============================================ */

var NBADB = {
  /** Fetch member profile */
  async getMember(userId) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('members').select('*').eq('id', userId).single();
  },

  /** Update member profile */
  async updateMember(userId, updates) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    var allowedFields = [
      'first_name',
      'middle_name',
      'last_name',
      'full_name',
      'gender',
      'phone',
      'organization_name',
      'chambers',
      'address',
      'photo_url'
    ];
    var payload = {};
    allowedFields.forEach(function (field) {
      if (Object.prototype.hasOwnProperty.call(updates || {}, field)) {
        payload[field] = updates[field];
      }
    });
    if (Object.keys(payload).length === 0) {
      return { data: null, error: { message: 'No editable fields were provided.' } };
    }
    return supabaseClient.from('members').update(payload).eq('id', userId).select().single();
  },

  /** List all members (admin) */
  async listMembers(filters = {}) {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    let q = supabaseClient.from('members').select('*').order('created_at', { ascending: false });
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.role) q = q.eq('role', filters.role);
    return q;
  },

  async updateMemberRole(memberId, role) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient
      .from('members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select('*')
      .single();
  },

  async updateMemberStatus(memberId, status, approvedBy = null) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    var payload = { status: status, updated_at: new Date().toISOString() };
    if (status === 'active') {
      payload.approved_at = new Date().toISOString();
      if (approvedBy) payload.approved_by = approvedBy;
    }
    return supabaseClient.from('members').update(payload).eq('id', memberId).select('*').single();
  },

  async getAdminDashboardStats() {
    if (!supabaseClient) return {
      data: { totalMembers: 0, activeMembers: 0, pendingMembers: 0, revenueYtd: 0 },
      error: { message: 'Database service is unavailable. Please check your Supabase configuration.' }
    };
    const [membersRes, paymentsRes] = await Promise.all([
      supabaseClient.from('members').select('id,status', { count: 'exact' }),
      supabaseClient.from('payments').select('amount,status,paid_at')
    ]);
    if (membersRes.error) return { data: null, error: membersRes.error };
    if (paymentsRes.error) return { data: null, error: paymentsRes.error };
    const members = membersRes.data || [];
    const nowYear = new Date().getFullYear();
    const revenueYtd = (paymentsRes.data || [])
      .filter((p) => p.status === 'confirmed' && p.paid_at && new Date(p.paid_at).getFullYear() === nowYear)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return {
      data: {
        totalMembers: members.length,
        activeMembers: members.filter((m) => m.status === 'active').length,
        pendingMembers: members.filter((m) => m.status === 'pending').length,
        revenueYtd
      },
      error: null
    };
  },

  async getMembershipGrowth(months) {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    var countMonths = Math.max(1, Math.min(Number(months) || 12, 24));
    var start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() - (countMonths - 1));
    var res = await supabaseClient
      .from('members')
      .select('id,created_at')
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true });
    if (res.error) return { data: null, error: res.error };
    var buckets = {};
    for (var i = 0; i < countMonths; i++) {
      var d = new Date(start);
      d.setMonth(start.getMonth() + i);
      var key = d.toISOString().slice(0, 7);
      buckets[key] = 0;
    }
    (res.data || []).forEach(function (row) {
      if (!row.created_at) return;
      var key = String(row.created_at).slice(0, 7);
      if (Object.prototype.hasOwnProperty.call(buckets, key)) buckets[key] += 1;
    });
    return {
      data: Object.keys(buckets).map(function (k) { return { month: k, count: buckets[k] }; }),
      error: null
    };
  },

  async getMemberDistribution() {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    var res = await supabaseClient.from('members').select('tier,status');
    if (res.error) return { data: null, error: res.error };
    var rows = res.data || [];
    var total = rows.length;
    var byTier = { junior: 0, senior: 0, san: 0 };
    var byStatus = { pending: 0, active: 0, suspended: 0, expired: 0, rejected: 0 };
    rows.forEach(function (m) {
      if (m.tier && byTier[m.tier] !== undefined) byTier[m.tier] += 1;
      if (m.status && byStatus[m.status] !== undefined) byStatus[m.status] += 1;
    });
    return { data: { total: total, byTier: byTier, byStatus: byStatus }, error: null };
  },

  async listPaymentsAdmin(filters) {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    var f = filters || {};
    var q = supabaseClient
      .from('payments')
      .select('id,user_id,member_id,reference,payment_reference,description,amount,method,payment_method,payment_channel,payment_year,payment_period,status,paid_at,approved_at,proof_file_path,proof_url,rejection_reason,created_at,members!payments_user_id_fkey(full_name,email,membership_number,scn_number,phone)')
      .order('created_at', { ascending: false })
      .limit(Number(f.limit) || 200);
    if (f.status) q = q.eq('status', f.status);
    if (f.year) q = q.eq('payment_year', f.year);
    return q;
  },

  async listAuditLogs(filters) {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    var f = filters || {};
    var q = supabaseClient.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(Number(f.limit) || 200);
    if (f.status) q = q.eq('status', f.status);
    if (f.action) q = q.ilike('action', '%' + f.action + '%');
    if (f.fromDate) q = q.gte('created_at', f.fromDate + 'T00:00:00.000Z');
    return q;
  },

  async createAuditLog(payload) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('audit_logs').insert(payload);
  },

  async getAnalyticsOverview() {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    var last30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
    var results = await Promise.all([
      supabaseClient.from('members').select('id,status,created_at,approved_at').gte('created_at', last30),
      supabaseClient.from('payments').select('id,amount,status,created_at').gte('created_at', monthStart),
      supabaseClient.from('events').select('id,created_at').gte('created_at', last30),
      supabaseClient.from('news').select('id,created_at').gte('created_at', last30)
    ]);
    var m = results[0]; var p = results[1]; var e = results[2]; var n = results[3];
    if (m.error) return { data: null, error: m.error };
    if (p.error) return { data: null, error: p.error };
    if (e.error) return { data: null, error: e.error };
    if (n.error) return { data: null, error: n.error };
    var members = m.data || [];
    var approvals = members.filter(function (x) { return x.status === 'active'; }).length;
    var submitted = members.filter(function (x) { return !!x.created_at; }).length;
    var conversionRate = submitted ? ((approvals / submitted) * 100) : 0;
    var monthRevenue = (p.data || []).filter(function (x) { return x.status === 'confirmed'; }).reduce(function (s, x) { return s + Number(x.amount || 0); }, 0);
    return {
      data: {
        newRegistrations30d: members.length,
        approvals30d: approvals,
        conversionRate: conversionRate,
        monthRevenue: monthRevenue,
        events30d: (e.data || []).length,
        news30d: (n.data || []).length
      },
      error: null
    };
  },

  /** Public lawyer search */
  async searchLawyers({ query = '', practiceArea = '', limit = 60 } = {}) {
    if (!supabaseClient) return { data: [], error: { message: 'Directory service is unavailable. Please check your Supabase configuration.' } };
    const rpcResult = await supabaseClient.rpc('search_lawyers', {
      search_text: query || null,
      practice_area: practiceArea || null,
      max_results: Math.max(1, Math.min(Number(limit) || 60, 200))
    });
    if (!rpcResult.error) return rpcResult;

    // Fallback for environments where RPC is not yet deployed
    let q = supabaseClient
      .from('members')
      .select('id,full_name,title,rank,scn_number,phone,email,organization_name,practice_areas,year_called,status')
      .in('status', ['active', 'pending'])
      .order('full_name', { ascending: true })
      .limit(Math.max(1, Math.min(Number(limit) || 60, 200)));
    if (query && query.trim()) q = q.or(`full_name.ilike.%${query.trim()}%,scn_number.ilike.%${query.trim()}%,organization_name.ilike.%${query.trim()}%`);
    if (practiceArea && practiceArea.trim()) q = q.contains('practice_areas', [practiceArea.trim()]);
    return q;
  },

  /** Get events */
  async listEvents() {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('events').select('*').order('event_date', { ascending: true });
  },

  /** Register for event */
  async registerEvent(eventId, userId) {
    if (!supabaseClient) return { data: { event_id: eventId, user_id: userId }, error: null };
    return supabaseClient.from('event_registrations').insert({ event_id: eventId, user_id: userId });
  },

  /** Get news/announcements */
  async listNews({ publishedOnly = false } = {}) {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    let query = supabaseClient.from('news').select('*').order('published_at', { ascending: false });
    if (publishedOnly) query = query.eq('is_published', true);
    return query;
  },

  async listNotices() {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('notices').select('*').order('created_at', { ascending: false });
  },

  async listPayments(userId) {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  },

  async createBankTransferPayment(payload) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('payments').insert(payload).select().single();
  },

  async getPaymentById(paymentId) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('payments').select('*').eq('id', paymentId).single();
  },

  async loadPendingPaymentsAdmin() {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient
      .from('payments')
      .select('id,member_id,user_id,payment_reference,reference,amount,payment_period,payment_year,payment_method,payment_channel,status,proof_url,proof_file_path,rejection_reason,created_at,members!payments_user_id_fkey(full_name,membership_number,scn_number,email,phone)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });
  },

  async reviewPayment(paymentId, action, note) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.rpc('review_payment', {
      p_payment_id: paymentId,
      p_action: action,
      p_note: note || null
    });
  },

  /** Get publications */
  async listPublications() {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('publications').select('*').order('created_at', { ascending: false });
  },

  async createPublication(payload) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('publications').insert(payload);
  },

  async listCourses() {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('cle_courses').select('*').order('course_date', { ascending: true });
  },

  async createCourse(payload) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('cle_courses').insert(payload);
  },

  async enrollCourse(courseId, userId) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('cle_enrollments').insert({ course_id: courseId, user_id: userId });
  },

  /** Track payment */
  async recordPayment(userId, payment) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('payments').insert({ user_id: userId, ...payment });
  },

  async updatePaymentStatus(paymentId, updates) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    if (!paymentId) return { data: null, error: { message: 'Missing payment ID.' } };
    return supabaseClient.from('payments').update(updates).eq('id', paymentId).select().single();
  },

  /** Submit contact inquiry */
  async submitInquiry(inquiry) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('inquiries').insert(inquiry);
  },

  async sendNotice({ title, body, priority = 'normal', target_audience = 'all', created_by = null }) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('notices').insert({ title, body, priority, target_audience, created_by });
  },

  async sendMessage({ sender_id, recipient_id, subject, body }) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('messages').insert({ sender_id, recipient_id, subject, body });
  },

  async createSupportTicket(payload) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('support_tickets').insert(payload);
  },

  async listMySupportTickets(userId) {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  },

  async listSupportTickets() {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('support_tickets').select('*').order('created_at', { ascending: false });
  },

  async updateSupportTicket(ticketId, updates) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('support_tickets').update(updates).eq('id', ticketId);
  },

  async createTicketResponse(ticketId, response, responderId, isAdmin = false) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('ticket_responses').insert({
      ticket_id: ticketId,
      responder_id: responderId,
      response: response,
      is_admin: isAdmin
    });
  },

  async listTicketResponses(ticketId) {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('ticket_responses').select(`
      *,
      responder:members!ticket_responses_responder_id_fkey(full_name, role)
    `).eq('ticket_id', ticketId).order('created_at', { ascending: true });
  },

  async listAdminNotifications() {
    if (!supabaseClient) return { data: [], error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(50);
  },

  async createNews({ title, excerpt, body, category, is_published = true, author_id = null }) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('news').insert({
      title,
      excerpt,
      body,
      category,
      is_published,
      published_at: is_published ? new Date().toISOString() : null,
      author_id
    });
  },

  async updateNews(newsId, updates) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    if (!newsId) return { data: null, error: { message: 'Missing news ID.' } };
    if (updates.is_published && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }
    return supabaseClient.from('news').update(updates).eq('id', newsId).select().single();
  },

  async deleteNews(newsId) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    if (!newsId) return { data: null, error: { message: 'Missing news ID.' } };
    return supabaseClient.from('news').delete().eq('id', newsId);
  },

  async getNewsById(newsId) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    if (!newsId) return { data: null, error: { message: 'Missing news ID.' } };
    return supabaseClient.from('news').select('*').eq('id', newsId).single();
  },

  async createEvent(payload) {
    if (!supabaseClient) return { data: null, error: { message: 'Database service is unavailable. Please check your Supabase configuration.' } };
    return supabaseClient.from('events').insert(payload);
  },

  /** Realtime channel for announcements */
  subscribeNews(callback) {
    if (!supabaseClient) return { unsubscribe: () => {} };
    return supabaseClient.channel('news-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, callback)
      .subscribe();
  },

  subscribeNewMembers(callback) {
    if (!supabaseClient) return { unsubscribe: () => {} };
    return supabaseClient.channel('members-insert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'members' }, callback)
      .subscribe();
  },

  subscribeAdminNotifications(callback) {
    if (!supabaseClient) return { unsubscribe: () => {} };
    return supabaseClient.channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, callback)
      .subscribe();
  }
};

/* ============================================
   STORAGE HELPERS
   ============================================ */

var NBAStorage = {
  avatarBucket: 'avatars',
  paymentProofBucket: 'payment-proofs',
  allowedPassportMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxPassportBytes: 2 * 1024 * 1024,
  allowedProofMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxProofBytes: 5 * 1024 * 1024,
  async uploadPassport(userId, file) {
    if (!supabaseClient) return { data: { path: `${userId}/demo-passport.jpg`, bucket: this.avatarBucket }, error: null };
    if (!userId) return { data: null, error: { message: 'Unable to upload image: user session not found.' } };
    if (!file) return { data: null, error: { message: 'Select a passport photo first.' } };

    var mimeType = String(file.type || '').toLowerCase();
    if (this.allowedPassportMimeTypes.indexOf(mimeType) === -1) {
      return { data: null, error: { message: 'Invalid file type. Please upload JPG, PNG, or WEBP image.' } };
    }
    if (Number(file.size || 0) > this.maxPassportBytes) {
      return { data: null, error: { message: 'Image is too large. Maximum allowed size is 2MB.' } };
    }

    var ext = mimeType === 'image/png' ? 'png' : (mimeType === 'image/webp' ? 'webp' : 'jpg');
    var path = `${userId}/passport-${Date.now()}.${ext}`;
    var result = await supabaseClient.storage.from(this.avatarBucket).upload(path, file, {
      upsert: true,
      contentType: mimeType,
      cacheControl: '3600'
    });
    if (result.error) {
      var msg = String(result.error.message || '').toLowerCase();
      var missingBucket = msg.includes('bucket not found') || msg.includes('not found');
      return {
        data: null,
        error: {
          message: missingBucket
            ? 'Storage is not ready yet. Ask admin to create a public "avatars" bucket and apply storage policies.'
            : (result.error.message || 'Passport upload failed. Please try again.')
        }
      };
    }
    return { data: { path: path, bucket: this.avatarBucket }, error: null };
  },
  getPassportPublicUrl(path) {
    if (!supabaseClient) return { data: { publicUrl: '#' } };
    return supabaseClient.storage.from(this.avatarBucket).getPublicUrl(path);
  },
  async uploadPaymentProof(userId, paymentReference, file) {
    if (!supabaseClient) return { data: null, error: { message: 'Storage service is unavailable. Please check your Supabase configuration.' } };
    if (!userId) return { data: null, error: { message: 'User session not found.' } };
    if (!file) return { data: null, error: { message: 'No proof file selected.' } };
    var mimeType = String(file.type || '').toLowerCase();
    if (this.allowedProofMimeTypes.indexOf(mimeType) === -1) {
      return { data: null, error: { message: 'Invalid file type. Upload JPG, PNG, WEBP, or PDF.' } };
    }
    if (Number(file.size || 0) > this.maxProofBytes) {
      return { data: null, error: { message: 'File too large. Maximum allowed size is 5MB.' } };
    }
    var ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop().toLowerCase() : (mimeType === 'application/pdf' ? 'pdf' : 'jpg');
    var safeRef = String(paymentReference || 'PAYMENT').replace(/[^a-zA-Z0-9_-]/g, '');
    var path = `${userId}/${safeRef}-${Date.now()}.${ext}`;
    var upload = await supabaseClient.storage.from(this.paymentProofBucket).upload(path, file, {
      upsert: true,
      contentType: mimeType,
      cacheControl: '3600'
    });
    if (upload.error) return { data: null, error: { message: upload.error.message || 'Unable to upload payment proof.' } };
    var signed = await supabaseClient.storage.from(this.paymentProofBucket).createSignedUrl(path, 60 * 60 * 24 * 7);
    return { data: { path: path, signedUrl: signed.data?.signedUrl || null }, error: null };
  },
  async createPaymentProofSignedUrl(path, expiresInSec = 3600) {
    if (!supabaseClient) return { data: null, error: { message: 'Storage service is unavailable. Please check your Supabase configuration.' } };
    if (!path) return { data: null, error: { message: 'Missing proof file path.' } };
    return supabaseClient.storage.from(this.paymentProofBucket).createSignedUrl(path, expiresInSec);
  },
  async uploadDocument(file, path) {
    if (!supabaseClient) return { data: { path }, error: null };
    return supabaseClient.storage.from('documents').upload(path, file, { upsert: true });
  },
  async getPublicUrl(path) {
    if (!supabaseClient) return { data: { publicUrl: '#' } };
    return supabaseClient.storage.from('documents').getPublicUrl(path);
  },
  async listFiles(folder = '') {
    if (!supabaseClient) return { data: mockData.documents, error: null };
    return supabaseClient.storage.from('documents').list(folder);
  }
};

/* ============================================
   MOCK DATA (when Supabase not configured)
   ============================================ */

var mockData = {
  profile: {
    id: 'demo-user',
    full_name: 'Barr. Adekunle Adebayo',
    first_name: 'Adekunle',
    middle_name: '',
    last_name: 'Adebayo',
    title: 'Barr.',
    rank: 'Member',
    email: 'demo@nbalokoja.org',
    phone: '+234 803 123 4567',
    gender: 'Male',
    scn_number: 'SCN/2018/12345',
    status: 'active',
    membership_year: 2026,
    dues_paid: true,
    organization_name: 'Adebayo & Partners Chambers',
    chambers: 'Adebayo & Partners Chambers',
    address: 'No. 12 Court Road, Lokoja, Kogi State',
    year_called: 2015,
    role: 'member'
  },
  members: [
    { id: '1', full_name: 'Sumaila Adeiku Abbas, Esq.', scn_number: 'SCN/2002/00876', status: 'active', role: 'chairman', dues_paid: true, year_called: 1998 },
    { id: '2', full_name: 'Muhammad S. Inuwa, Esq.', scn_number: 'SCN/2005/01234', status: 'active', role: 'vice_chairman', dues_paid: true, year_called: 2001 },
    { id: '3', full_name: 'Friday Okpanachi Ekpa, Esq.', scn_number: 'SCN/2008/02156', status: 'active', role: 'secretary', dues_paid: true, year_called: 2004 },
    { id: '4', full_name: 'Aisha Ibrahim, Esq.', scn_number: 'SCN/2015/05432', status: 'active', role: 'member', dues_paid: true, year_called: 2012 },
    { id: '5', full_name: 'Daniel Okoro, Esq.', scn_number: 'SCN/2017/07891', status: 'pending', role: 'member', dues_paid: false, year_called: 2014 }
  ],
  events: [
    { id: 'e1', title: '2026 Annual Law Week', event_date: '2026-09-22', location: 'Lokoja City Hall', description: 'A week-long programme of lectures, dinners, awards and CLE sessions.', category: 'Law Week' },
    { id: 'e2', title: 'CLE: Ethics in Modern Practice', event_date: '2026-05-18', location: 'NBA Lokoja Secretariat', description: 'Mandatory continuing legal education on professional ethics and emerging issues.', category: 'CLE' },
    { id: 'e3', title: 'Bar–Bench Forum', event_date: '2026-06-14', location: 'Kogi State High Court Complex', description: 'Quarterly engagement between members of the Bar and the Bench.', category: 'Forum' },
    { id: 'e4', title: 'Monthly General Meeting', event_date: '2026-05-30', location: 'NBA Lokoja Secretariat', description: 'Routine general meeting open to all financial members.', category: 'Meeting' }
  ],
  news: [
    { id: 'n1', title: 'NBA Lokoja Branch Inaugurates New Executive for 2025–2027 Tenure', published_at: '2026-04-10', excerpt: 'S. A. Abbas, Esq. has been formally sworn in as Chairman of the branch...', category: 'Branch News' },
    { id: 'n2', title: 'Branch Commends Kogi Government on Justice Sector Reforms', published_at: '2026-03-22', excerpt: 'In a press release, the branch commended ongoing reforms in the State justice sector...', category: 'Press Release' },
    { id: 'n3', title: 'Mandatory CPD Rules: What Every Lokoja Lawyer Should Know', published_at: '2026-03-08', excerpt: 'A comprehensive breakdown of the new mandatory continuing professional development rules.', category: 'Advisory' },
    { id: 'n4', title: 'Welfare Committee Disburses Support to Members in Need', published_at: '2026-02-14', excerpt: 'The branch welfare committee announces support disbursement for the quarter.', category: 'Welfare' }
  ],
  publications: [
    { id: 'p1', title: 'NBA Lokoja Bulletin — Q1 2026', type: 'Newsletter', size_kb: 1240, url: '#' },
    { id: 'p2', title: 'Annual Report 2025', type: 'Report', size_kb: 4380, url: '#' },
    { id: 'p3', title: 'Constitution of NBA Lokoja Branch (Amended)', type: 'Constitution', size_kb: 980, url: '#' },
    { id: 'p4', title: 'Practice Directions Compendium 2025', type: 'Compendium', size_kb: 2150, url: '#' }
  ],
  documents: [
    { name: 'Membership-Certificate.pdf', metadata: { size: 320000 } },
    { name: 'Code-of-Conduct.pdf', metadata: { size: 540000 } },
    { name: 'Annual-Dues-Receipt-2026.pdf', metadata: { size: 120000 } }
  ]
};

function mockResponse(data, action) {
  console.log(`[NBA Lokoja] Mock ${action}:`, data);
  if (action === 'signIn') localStorage.setItem('nba_demo_user', JSON.stringify(data.user));
  return Promise.resolve({ data, error: null });
}

// Expose globally
window.NBAAuth = NBAAuth;
window.NBADB = NBADB;
window.NBAStorage = NBAStorage;
window.NBA_SUPABASE_READY = !!supabaseClient;
window.supabaseClient = supabaseClient;
