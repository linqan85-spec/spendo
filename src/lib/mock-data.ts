import type { 
  Company, 
  Vendor, 
  Expense, 
  MonthlySummary, 
  CategorySummary,
  ExpenseCategory,
  DashboardData 
} from '@/types/spendo';

// Mock company
export const mockCompany: Company = {
  id: 'company-1',
  name: 'Teknikbolaget AB',
  org_number: '556123-4567',
  currency: 'SEK',
  subscription_status: 'trialing',
  base_price_per_month: 499,
  extra_user_price: 99,
  max_users_included: 1,
  trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock vendors
export const mockVendors: Vendor[] = [
  { id: 'v1', company_id: 'company-1', name: 'Slack', normalized_name: 'slack', is_saas: true, default_category: 'saas', created_at: '', updated_at: '' },
  { id: 'v2', company_id: 'company-1', name: 'GitHub', normalized_name: 'github', is_saas: true, default_category: 'saas', created_at: '', updated_at: '' },
  { id: 'v3', company_id: 'company-1', name: 'AWS', normalized_name: 'aws', is_saas: true, default_category: 'saas', created_at: '', updated_at: '' },
  { id: 'v4', company_id: 'company-1', name: 'Figma', normalized_name: 'figma', is_saas: true, default_category: 'saas', created_at: '', updated_at: '' },
  { id: 'v5', company_id: 'company-1', name: 'Notion', normalized_name: 'notion', is_saas: true, default_category: 'saas', created_at: '', updated_at: '' },
  { id: 'v6', company_id: 'company-1', name: 'Google Workspace', normalized_name: 'google_workspace', is_saas: true, default_category: 'saas', created_at: '', updated_at: '' },
  { id: 'v7', company_id: 'company-1', name: 'Vercel', normalized_name: 'vercel', is_saas: true, default_category: 'saas', created_at: '', updated_at: '' },
  { id: 'v8', company_id: 'company-1', name: 'Linear', normalized_name: 'linear', is_saas: true, default_category: 'saas', created_at: '', updated_at: '' },
  { id: 'v9', company_id: 'company-1', name: 'SJ', normalized_name: 'sj', is_saas: false, default_category: 'resor', created_at: '', updated_at: '' },
  { id: 'v10', company_id: 'company-1', name: 'Scandic Hotels', normalized_name: 'scandic', is_saas: false, default_category: 'resor', created_at: '', updated_at: '' },
  { id: 'v11', company_id: 'company-1', name: 'IKEA', normalized_name: 'ikea', is_saas: false, default_category: 'kontor', created_at: '', updated_at: '' },
  { id: 'v12', company_id: 'company-1', name: 'Dustin', normalized_name: 'dustin', is_saas: false, default_category: 'it_verktyg', created_at: '', updated_at: '' },
  { id: 'v13', company_id: 'company-1', name: 'Facebook Ads', normalized_name: 'facebook_ads', is_saas: false, default_category: 'marknadsforing', created_at: '', updated_at: '' },
  { id: 'v14', company_id: 'company-1', name: 'Google Ads', normalized_name: 'google_ads', is_saas: false, default_category: 'marknadsforing', created_at: '', updated_at: '' },
  { id: 'v15', company_id: 'company-1', name: 'PostNord', normalized_name: 'postnord', is_saas: false, default_category: 'ovrigt', created_at: '', updated_at: '' },
];

// Generate mock expenses for the last 6 months
function generateMockExpenses(): Expense[] {
  const expenses: Expense[] = [];
  const now = new Date();
  
  // Recurring SaaS expenses
  const saasExpenses = [
    { vendor_id: 'v1', amount: 1250, description: 'Slack Business+' },
    { vendor_id: 'v2', amount: 4500, description: 'GitHub Team' },
    { vendor_id: 'v3', amount: 12500, description: 'AWS Infrastructure' },
    { vendor_id: 'v4', amount: 1800, description: 'Figma Professional' },
    { vendor_id: 'v5', amount: 990, description: 'Notion Team' },
    { vendor_id: 'v6', amount: 2400, description: 'Google Workspace Business' },
    { vendor_id: 'v7', amount: 1900, description: 'Vercel Pro' },
    { vendor_id: 'v8', amount: 800, description: 'Linear Standard' },
  ];

  // Generate 6 months of recurring SaaS
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 15);
    
    saasExpenses.forEach((exp, idx) => {
      expenses.push({
        id: `exp-saas-${monthOffset}-${idx}`,
        company_id: 'company-1',
        vendor_id: exp.vendor_id,
        external_id: null,
        type: 'invoice',
        amount: exp.amount * (1 + (Math.random() * 0.1 - 0.05)), // ±5% variation
        vat_amount: exp.amount * 0.25,
        currency: 'SEK',
        transaction_date: date.toISOString().split('T')[0],
        description: exp.description,
        category: 'saas',
        subcategory: null,
        is_recurring: true,
        source: 'kleer',
        is_trial_sample: false,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
        vendor: mockVendors.find(v => v.id === exp.vendor_id),
      });
    });
  }

  // Add random one-time expenses
  const oneTimeExpenses = [
    { vendor_id: 'v9', amount: 1850, category: 'resor' as ExpenseCategory, description: 'Tågresa Stockholm-Göteborg' },
    { vendor_id: 'v10', amount: 2400, category: 'resor' as ExpenseCategory, description: 'Hotellnatt konferens' },
    { vendor_id: 'v11', amount: 4500, category: 'kontor' as ExpenseCategory, description: 'Kontorsmöbler' },
    { vendor_id: 'v12', amount: 8900, category: 'it_verktyg' as ExpenseCategory, description: 'Nya laptops' },
    { vendor_id: 'v13', amount: 15000, category: 'marknadsforing' as ExpenseCategory, description: 'Facebook Ads kampanj' },
    { vendor_id: 'v14', amount: 22000, category: 'marknadsforing' as ExpenseCategory, description: 'Google Ads kampanj' },
    { vendor_id: 'v15', amount: 450, category: 'ovrigt' as ExpenseCategory, description: 'Frakt' },
  ];

  // Distribute one-time expenses across months
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const numExpenses = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numExpenses; i++) {
      const exp = oneTimeExpenses[Math.floor(Math.random() * oneTimeExpenses.length)];
      const day = 1 + Math.floor(Math.random() * 28);
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, day);
      
      expenses.push({
        id: `exp-one-${monthOffset}-${i}`,
        company_id: 'company-1',
        vendor_id: exp.vendor_id,
        external_id: null,
        type: Math.random() > 0.5 ? 'expense' : 'invoice',
        amount: exp.amount * (0.8 + Math.random() * 0.4),
        vat_amount: exp.amount * 0.25 * (0.8 + Math.random() * 0.4),
        currency: 'SEK',
        transaction_date: date.toISOString().split('T')[0],
        description: exp.description,
        category: exp.category,
        subcategory: null,
        is_recurring: false,
        source: 'kleer',
        is_trial_sample: false,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
        vendor: mockVendors.find(v => v.id === exp.vendor_id),
      });
    }
  }

  return expenses.sort((a, b) => 
    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );
}

export const mockExpenses = generateMockExpenses();

// Calculate monthly summaries from expenses
function calculateMonthlySummaries(): MonthlySummary[] {
  const summaries: Map<string, MonthlySummary> = new Map();
  
  mockExpenses.forEach(exp => {
    const date = new Date(exp.transaction_date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    const existing = summaries.get(key) || {
      id: `summary-${key}`,
      company_id: 'company-1',
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      total_spend: 0,
      saas_spend: 0,
      expense_spend: 0,
      invoice_spend: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    existing.total_spend += exp.amount;
    if (exp.category === 'saas') {
      existing.saas_spend += exp.amount;
    }
    if (exp.type === 'expense') {
      existing.expense_spend += exp.amount;
    } else {
      existing.invoice_spend += exp.amount;
    }
    
    summaries.set(key, existing);
  });

  return Array.from(summaries.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

export const mockMonthlySummaries = calculateMonthlySummaries();

// Calculate category summaries
function calculateCategorySummaries(): CategorySummary[] {
  const summaries: Map<string, CategorySummary> = new Map();
  
  mockExpenses.forEach(exp => {
    const date = new Date(exp.transaction_date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${exp.category}`;
    
    const existing = summaries.get(key) || {
      id: `cat-${key}`,
      company_id: 'company-1',
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      category: exp.category,
      total_amount: 0,
      created_at: new Date().toISOString(),
    };

    existing.total_amount += exp.amount;
    summaries.set(key, existing);
  });

  return Array.from(summaries.values());
}

export const mockCategorySummaries = calculateCategorySummaries();

// Get dashboard data for a specific month
export function getMockDashboardData(year: number, month: number): DashboardData {
  const currentMonth = mockMonthlySummaries.find(s => s.year === year && s.month === month) || {
    id: 'empty',
    company_id: 'company-1',
    year,
    month,
    total_spend: 0,
    saas_spend: 0,
    expense_spend: 0,
    invoice_spend: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const previousMonth = mockMonthlySummaries.find(s => s.year === prevYear && s.month === prevMonth) || null;

  const categoryBreakdown = mockCategorySummaries.filter(c => c.year === year && c.month === month);

  // Calculate top vendors for the month
  const monthExpenses = mockExpenses.filter(e => {
    const date = new Date(e.transaction_date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const vendorTotals = new Map<string, number>();
  monthExpenses.forEach(exp => {
    if (exp.vendor_id) {
      vendorTotals.set(exp.vendor_id, (vendorTotals.get(exp.vendor_id) || 0) + exp.amount);
    }
  });

  const topVendors = Array.from(vendorTotals.entries())
    .map(([vendor_id, total]) => ({
      vendor: mockVendors.find(v => v.id === vendor_id)!,
      total,
    }))
    .filter(v => v.vendor)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Calculate top SaaS
  const saasVendors = topVendors.filter(v => v.vendor.is_saas);
  const topSaas = saasVendors.map(v => ({
    vendor: v.vendor,
    total: v.total,
    monthlyAvg: v.total, // In real app, calculate from historical data
  }));

  const recentExpenses = monthExpenses.slice(0, 10);

  return {
    currentMonth,
    previousMonth,
    categoryBreakdown,
    topVendors,
    topSaas,
    recentExpenses,
  };
}

// Get available months for filter
export function getAvailableMonths(): Array<{ year: number; month: number; label: string }> {
  const months = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];
  
  return mockMonthlySummaries.map(s => ({
    year: s.year,
    month: s.month,
    label: `${months[s.month - 1]} ${s.year}`,
  }));
}
