/**
 * Project scorecard enums — đồng bộ GET/POST /api/Projects (projectScorecard).
 * calculatedScore: FE không gửi / không hiển thị trên form.
 */

export const TEAM_SIZE = [
  { value: 'Solo', label: 'Solo Founder', helper: 'Chỉ có 1 người sáng lập, gánh vác mọi vai trò trong dự án.' },
  { value: 'TwoFounders', label: 'Cặp Co-founders', helper: '2 người sáng lập, thường bù trừ kỹ năng cho nhau (ví dụ: 1 Kỹ thuật & 1 Kinh doanh).' },
  { value: 'ThreeOrMore', label: 'Đội ngũ hoàn thiện', helper: 'Từ 3 co-founders trở lên, cấu trúc phòng ban và phân chia công việc rõ ràng.' },
];

export const TEAM_EXPERIENCE = [
  { value: 'FirstTime', label: 'Lần đầu khởi nghiệp', helper: 'Đội ngũ trẻ, nhiệt huyết nhưng chưa có kinh nghiệm quản lý hoặc gọi vốn trước đây.' },
  { value: 'IndustryExpert', label: 'Chuyên gia trong ngành', helper: 'Founder có nhiều năm kinh nghiệm làm việc chuyên sâu trong lĩnh vực đang khởi nghiệp.' },
  { value: 'SerialFounder', label: 'Đã từng khởi nghiệp', helper: 'Đã từng sáng lập/đồng sáng lập và thoái vốn (exit) hoặc vận hành thành công startup trước đó.' },
];

export const TARGET_MARKET_SIZE = [
  { value: 'Niche', label: 'Thị trường ngách', helper: 'Quy mô dưới 250 tỷ VNĐ, tập trung vào tệp khách hàng rất đặc thù.' },
  { value: 'Medium', label: 'Thị trường tầm trung', helper: 'Quy mô từ 250 tỷ - 2.500 tỷ VNĐ, không gian tăng trưởng tốt tại thị trường nội địa hoặc khu vực.' },
  { value: 'Large', label: 'Thị trường lớn', helper: 'Quy mô trên 2.500 tỷ VNĐ, tiềm năng mở rộng (Scale) ra toàn cầu hoặc thống trị khu vực.' },
];

export const MARKET_GROWTH = [
  { value: 'Slow', label: 'Chậm', helper: 'Ngành truyền thống, tốc độ số hóa chậm hoặc đã bão hòa (Tăng trưởng dưới 5%/năm).' },
  { value: 'Steady', label: 'Ổn định', helper: 'Tăng trưởng đều đặn cùng nhịp với nền kinh tế (Tăng trưởng từ 5% - 15%/năm).' },
  { value: 'Fast', label: 'Nóng / Đột phá', helper: 'Đang là xu hướng mạnh, tăng trưởng rất nhanh (ví dụ: AI, Proptech, Fintech) (Tăng trưởng > 15%/năm).' },
];

export const PRODUCT_READINESS = [
  { value: 'Idea', label: 'Ý tưởng', helper: 'Mới nằm trên giấy, đang khảo sát thị trường, chưa có sản phẩm thực tế.' },
  { value: 'Prototype', label: 'Bản mẫu (Prototype)', helper: 'Đã có bản phác thảo hoặc thiết kế tính năng cơ bản, dùng để demo.' },
  { value: 'MVP', label: 'Sản phẩm tối thiểu (MVP)', helper: 'Đã sản xuất xong tính năng cốt lõi, có thể đưa cho người dùng đầu tiên trải nghiệm.' },
  { value: 'MarketReady', label: 'Sẵn sàng ra thị trường', helper: 'Sản phẩm hoàn thiện, ít lỗi, đã đóng gói sẵn sàng để bán đại trà.' },
];

export const IP_PROTECTION = [
  { value: 'None', label: 'Không có bảo vệ', helper: 'Công nghệ dễ bị copy, sử dụng mã nguồn mở hoặc mô hình kinh doanh thuần túy.' },
  { value: 'Defensible', label: 'Có rào cản mềm', helper: 'Đang nộp đơn sở hữu trí tuệ, hoặc sở hữu dữ liệu/thuật toán nội bộ khó sao chép ngay.' },
  { value: 'Secured', label: 'Đã được bảo hộ', helper: 'Sở hữu bằng sáng chế độc quyền, công nghệ lõi được pháp luật bảo vệ.' },
];

export const BARRIER_TO_ENTRY = [
  { value: 'Low', label: 'Thấp', helper: 'Chi phí bắt đầu rẻ, công nghệ đơn giản, đối thủ dễ dàng sao chép và nhảy vào thị phần.' },
  { value: 'Medium', label: 'Trung bình', helper: 'Đòi hỏi một lượng vốn nhất định hoặc mạng lưới quan hệ (network) tốt để bắt đầu.' },
  { value: 'High', label: 'Cao', helper: 'Cần vốn đầu tư ban đầu khổng lồ, hoặc đòi hỏi giấy phép pháp lý khắt khe (VD: Y tế, Tài chính).' },
];

export const CURRENT_TRACTION = [
  { value: 'PreRevenue', label: 'Chưa có doanh thu', helper: 'Đang trong giai đoạn phát triển, chưa phát sinh dòng tiền.' },
  { value: 'UserAcquisition', label: 'Có người dùng thử', helper: 'Chưa có lợi nhuận nhưng đã có lượng người dùng thường xuyên hoặc đăng ký chờ lớn.' },
  { value: 'RevenueGenerating', label: 'Đã có doanh thu', helper: 'Đã bắt đầu có khách hàng trả tiền, mô hình kinh doanh được chứng minh tính khả thi.' },
  { value: 'ScalingOrProfitable', label: 'Tăng trưởng mạnh/Có lãi', helper: 'Dòng tiền dương hoặc doanh thu đang có tốc độ tăng trưởng tính bằng lần (MoM/YoY).' },
];

export const RUNWAY_MONTHS = [
  { value: 'Under6Months', label: 'Dưới 6 tháng', helper: 'Nguy cơ cạn vốn cao, cần tiền gấp để duy trì hoạt động.' },
  { value: 'SixToTwelveMonths', label: 'Từ 6 đến 12 tháng', helper: 'Mức độ an toàn trung bình, có đủ thời gian để tối ưu sản phẩm trong lúc gọi vốn.' },
  { value: 'Over12Months', label: 'Trên 12 tháng', helper: 'Dòng tiền khỏe, gọi vốn chủ yếu để mở rộng thị phần (Scale) chứ không phải để sinh tồn.' },
];

/** Thứ tự field + options list (dùng form & hiển thị) */
export const SCORECARD_SECTIONS = [
  {
    title: 'Đội ngũ sáng lập',
    subtitle: 'Đánh giá cơ cấu và kinh nghiệm của đội ngũ.',
    fields: [
      { key: 'teamSize', apiKey: 'TeamSize', label: 'Kích thước đội ngũ', options: TEAM_SIZE },
      { key: 'teamExperience', apiKey: 'TeamExperience', label: 'Kinh nghiệm đội ngũ', options: TEAM_EXPERIENCE },
    ],
  },
  {
    title: 'Thị trường',
    subtitle: 'Quy mô và tốc độ tăng trưởng thị trường mục tiêu.',
    fields: [
      { key: 'targetMarketSize', apiKey: 'TargetMarketSize', label: 'Quy mô thị trường', options: TARGET_MARKET_SIZE },
      { key: 'marketGrowth', apiKey: 'MarketGrowth', label: 'Tốc độ tăng trưởng thị trường', options: MARKET_GROWTH },
    ],
  },
  {
    title: 'Sản phẩm & Công nghệ',
    subtitle: 'Giai đoạn sản phẩm và bảo vệ sở hữu trí tuệ.',
    fields: [
      { key: 'productReadiness', apiKey: 'ProductReadiness', label: 'Độ sẵn sàng của sản phẩm', options: PRODUCT_READINESS },
      { key: 'ipProtection', apiKey: 'IpProtection', label: 'Bảo vệ sở hữu trí tuệ', options: IP_PROTECTION },
    ],
  },
  {
    title: 'Môi trường cạnh tranh',
    subtitle: 'Rào cản gia nhập ngành.',
    fields: [{ key: 'barrierToEntry', apiKey: 'BarrierToEntry', label: 'Rào cản gia nhập ngành', options: BARRIER_TO_ENTRY }],
  },
  {
    title: 'Lực kéo thị trường',
    subtitle: 'Mức độ chấp nhận của thị trường đối với sản phẩm.',
    fields: [{ key: 'currentTraction', apiKey: 'CurrentTraction', label: 'Tình trạng kinh doanh hiện tại', options: CURRENT_TRACTION }],
  },
  {
    title: 'Nhu cầu gọi vốn',
    subtitle: 'Thời gian duy trì hoạt động (runway).',
    fields: [{ key: 'runwayMonths', apiKey: 'RunwayMonths', label: 'Thời gian duy trì hoạt động', options: RUNWAY_MONTHS }],
  },
];

export const SCORECARD_BOOLEAN_FIELD = {
  key: 'hasTechnicalCofounder',
  apiKey: 'HasTechnicalCofounder',
  label: 'Co-founder kỹ thuật',
  helper: 'Đội có thành viên đảm nhiệm vai trò kỹ thuật / công nghệ lõi (CTO, lead engineer, v.v.).',
};

/** Các key enum scorecard trên form */
export const SCORECARD_FORM_ENUM_KEYS = [
  'teamSize',
  'teamExperience',
  'targetMarketSize',
  'marketGrowth',
  'productReadiness',
  'ipProtection',
  'barrierToEntry',
  'currentTraction',
  'runwayMonths',
];

/** Lấy projectScorecard từ object API */
export function getProjectScorecardFromProject(project) {
  if (!project) return null;
  return project.projectScorecard || project.ProjectScorecard || null;
}

/** Form state từ API projectScorecard. */
export function scorecardFromApiToFormState(sc) {
  const empty = {
    teamSize: '',
    teamExperience: '',
    hasTechnicalCofounder: false,
    targetMarketSize: '',
    marketGrowth: '',
    productReadiness: '',
    ipProtection: '',
    barrierToEntry: '',
    currentTraction: '',
    runwayMonths: '',
  };
  if (!sc || typeof sc !== 'object') return empty;
  const g = (a, b) => sc[a] ?? sc[b] ?? '';
  const gb = (a, b) => {
    const v = sc[a] ?? sc[b];
    if (typeof v === 'boolean') return v;
    if (v === 'true' || v === true) return true;
    if (v === 'false' || v === false) return false;
    return false;
  };
  return {
    teamSize: g('teamSize', 'TeamSize'),
    teamExperience: g('teamExperience', 'TeamExperience'),
    hasTechnicalCofounder: gb('hasTechnicalCofounder', 'HasTechnicalCofounder'),
    targetMarketSize: g('targetMarketSize', 'TargetMarketSize'),
    marketGrowth: g('marketGrowth', 'MarketGrowth'),
    productReadiness: g('productReadiness', 'ProductReadiness'),
    ipProtection: g('ipProtection', 'IpProtection'),
    barrierToEntry: g('barrierToEntry', 'BarrierToEntry'),
    currentTraction: g('currentTraction', 'CurrentTraction'),
    runwayMonths: g('runwayMonths', 'RunwayMonths'),
  };
}

export function getScorecardOptionLabel(options, value) {
  if (value === null || value === undefined || value === '') return '—';
  
  // Try to find the label in options
  const found = options.find((o) => 
    o.value === value || 
    String(o.value).toLowerCase() === String(value).toLowerCase()
  );
  if (found) return found.label;
  
  // If not found, check if it's a numeric NaN
  if (typeof value === 'number' && isNaN(value)) return '—';
  
  // Return the original value as a string if no mapping found
  return String(value);
}


/** { count, label } từ teamSize enum — dùng card kanban / tóm tắt */
export function getTeamHeadcountFromScorecard(project) {
  const sc = getProjectScorecardFromProject(project);
  if (!sc) return { count: 0, label: '' };
  const v = sc.teamSize ?? sc.TeamSize;
  const map = { Solo: 1, TwoFounders: 2, ThreeOrMore: 3 };
  return {
    count: map[v] || 0,
    label: v ? getScorecardOptionLabel(TEAM_SIZE, v) : '',
  };
}

/** Các dòng label + value đã Việt hoá — dùng dashboard / staff detail */
export function getScorecardRowsForDisplay(project) {
  const sc = getProjectScorecardFromProject(project);
  if (!sc) return [];
  const pick = (k, apiK) => sc[k] ?? sc[apiK];
  const rows = [];
  const t0 = SCORECARD_SECTIONS[0];
  const pushField = (sectionTitle, label, options, k, apiK) => {
    const v = pick(k, apiK);
    if (v === undefined || v === null || v === '') return;
    rows.push({ section: sectionTitle, label, value: getScorecardOptionLabel(options, v) });
  };
  pushField(t0.title, t0.fields[0].label, t0.fields[0].options, t0.fields[0].key, t0.fields[0].apiKey);
  pushField(t0.title, t0.fields[1].label, t0.fields[1].options, t0.fields[1].key, t0.fields[1].apiKey);
  const ht = pick('hasTechnicalCofounder', 'HasTechnicalCofounder');
  if (typeof ht === 'boolean' || ht === 'true' || ht === 'false') {
    rows.push({
      section: t0.title,
      label: SCORECARD_BOOLEAN_FIELD.label,
      value: ht === true || ht === 'true' ? 'Có' : 'Không',
    });
  }
  for (let i = 1; i < SCORECARD_SECTIONS.length; i++) {
    const sec = SCORECARD_SECTIONS[i];
    for (const f of sec.fields) {
      pushField(sec.title, f.label, f.options, f.key, f.apiKey);
    }
  }
  return rows;
}

/** Card feed: traction, quy mô TT (enum), đội (enum) */
export function getScorecardQuickStats(project) {
  const sc = getProjectScorecardFromProject(project);
  if (!sc) return null;
  const pick = (a, b) => sc[a] ?? sc[b];
  return {
    traction: getScorecardOptionLabel(CURRENT_TRACTION, pick('currentTraction', 'CurrentTraction')),
    market: getScorecardOptionLabel(TARGET_MARKET_SIZE, pick('targetMarketSize', 'TargetMarketSize')),
    teamSize: getScorecardOptionLabel(TEAM_SIZE, pick('teamSize', 'TeamSize')),
  };
}
