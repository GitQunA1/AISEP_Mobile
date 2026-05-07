/**
 * Project scorecard enums — đồng bộ GET/POST /api/Projects (projectScorecard).
 * calculatedScore: FE không gửi / không hiển thị trên form.
 */

export const TEAM_SIZE = [
  { value: 1, label: 'Solo Founder', helper: 'Chỉ có 1 người sáng lập, gánh vác mọi vai trò trong dự án.' },
  { value: 2, label: 'Cặp Co-founders', helper: '2 người sáng lập, thường bù trừ kỹ năng cho nhau (ví dụ: 1 Kỹ thuật & 1 Kinh doanh).' },
  { value: 3, label: 'Đội ngũ hoàn thiện', helper: 'Từ 3 co-founders trở lên, cấu trúc phòng ban và phân chia công việc rõ ràng.' },
];

export const TEAM_EXPERIENCE = [
  { value: 1, label: 'Lần đầu khởi nghiệp', helper: 'Đội ngũ trẻ, nhiệt huyết nhưng chưa có kinh nghiệm quản lý hoặc gọi vốn trước đây.' },
  { value: 2, label: 'Chuyên gia trong ngành', helper: 'Founder có nhiều năm kinh nghiệm làm việc chuyên sâu trong lĩnh vực đang khởi nghiệp.' },
  { value: 3, label: 'Đã từng khởi nghiệp', helper: 'Đã từng sáng lập/đồng sáng lập và thoái vốn (exit) hoặc vận hành thành công startup trước đó.' },
];

export const TARGET_MARKET_SIZE = [
  { value: 1, label: 'Thị trường ngách', helper: 'Quy mô dưới 250 tỷ VNĐ, tập trung vào tệp khách hàng rất đặc thù.' },
  { value: 2, label: 'Thị trường tầm trung', helper: 'Quy mô từ 250 tỷ - 2.500 tỷ VNĐ, không gian tăng trưởng tốt tại thị trường nội địa hoặc khu vực.' },
  { value: 3, label: 'Thị trường lớn', helper: 'Quy mô trên 2.500 tỷ VNĐ, tiềm năng mở rộng (Scale) ra toàn cầu hoặc thống trị khu vực.' },
];

export const MARKET_GROWTH = [
  { value: 1, label: 'Chậm', helper: 'Ngành truyền thống, tốc độ số hóa chậm hoặc đã bão hòa (Tăng trưởng dưới 5%/năm).' },
  { value: 2, label: 'Ổn định', helper: 'Tăng trưởng đều đặn cùng nhịp với nền kinh tế (Tăng trưởng từ 5% - 15%/năm).' },
  { value: 3, label: 'Fast', label: 'Nóng / Đột phá', helper: 'Đang là xu hướng mạnh, tăng trưởng rất nhanh (ví dụ: AI, Proptech, Fintech) (Tăng trưởng > 15%/năm).' },
];

export const PRODUCT_READINESS = [
  { value: 1, label: 'Ý tưởng', helper: 'Mới nằm trên giấy, đang khảo sát thị trường, chưa có sản phẩm thực tế.' },
  { value: 2, label: 'Bản mẫu (Prototype)', helper: 'Đã có bản phác thảo hoặc thiết kế tính năng cơ bản, dùng để demo.' },
  { value: 3, label: 'Sản phẩm tối thiểu (MVP)', helper: 'Đã sản xuất xong tính năng cốt lõi, có thể đưa cho người dùng đầu tiên trải nghiệm.' },
  { value: 4, label: 'Sẵn sàng ra thị trường', helper: 'Sản phẩm hoàn thiện, ít lỗi, đã đóng gói sẵn sàng để bán đại trà.' },
];

export const IP_PROTECTION = [
  { value: 1, label: 'Không có bảo vệ', helper: 'Công nghệ dễ bị copy, sử dụng mã nguồn mở hoặc mô hình kinh doanh thuần túy.' },
  { value: 2, label: 'Có rào cản mềm', helper: 'Đang nộp đơn sở hữu trí tuệ, hoặc sở hữu dữ liệu/thuật toán nội bộ khó sao chép ngay.' },
  { value: 3, label: 'Đã được bảo hộ', helper: 'Sở hữu bằng sáng chế độc quyền, công nghệ lõi được pháp luật bảo vệ.' },
];

export const BARRIER_TO_ENTRY = [
  { value: 1, label: 'Thấp', helper: 'Chi phí bắt đầu rẻ, công nghệ đơn giản, đối thủ dễ dàng sao chép và nhảy vào thị phần.' },
  { value: 2, label: 'Trung bình', helper: 'Đòi hỏi một lượng vốn nhất định hoặc mạng lưới quan hệ (network) tốt để bắt đầu.' },
  { value: 3, label: 'Cao', helper: 'Cần vốn đầu tư ban đầu khổng lồ, hoặc đòi hỏi giấy phép pháp lý khắt khe (VD: Y tế, Tài chính).' },
];

export const CURRENT_TRACTION = [
  { value: 1, label: 'Chưa có doanh thu', helper: 'Đang trong giai đoạn phát triển, chưa phát sinh dòng tiền.' },
  { value: 2, label: 'Có người dùng thử', helper: 'Chưa có lợi nhuận nhưng đã có lượng người dùng thường xuyên hoặc đăng ký chờ lớn.' },
  { value: 3, label: 'Đã có doanh thu', helper: 'Đã bắt đầu có khách hàng trả tiền, mô hình kinh doanh được chứng minh tính khả thi.' },
  { value: 4, label: 'Tăng trưởng mạnh/Có lãi', helper: 'Dòng tiền dương hoặc doanh thu đang có tốc độ tăng trưởng tính bằng lần (MoM/YoY).' },
];

export const RUNWAY_MONTHS = [
  { value: 1, label: 'Dưới 6 tháng', helper: 'Nguy cơ cạn vốn cao, cần tiền gấp để duy trì hoạt động.' },
  { value: 2, label: 'Từ 6 đến 12 tháng', helper: 'Mức độ an toàn trung bình, có đủ thời gian để tối ưu sản phẩm trong lúc gọi vốn.' },
  { value: 3, label: 'Trên 12 tháng', helper: 'Dòng tiền khỏe, gọi vốn chủ yếu để mở rộng thị phần (Scale) chứ không phải để sinh tồn.' },
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
    teamSize: Number(g('teamSize', 'TeamSize') || 0),
    teamExperience: Number(g('teamExperience', 'TeamExperience') || 0),
    hasTechnicalCofounder: gb('hasTechnicalCofounder', 'HasTechnicalCofounder'),
    targetMarketSize: Number(g('targetMarketSize', 'TargetMarketSize') || 0),
    marketGrowth: Number(g('marketGrowth', 'MarketGrowth') || 0),
    productReadiness: Number(g('productReadiness', 'ProductReadiness') || 0),
    ipProtection: Number(g('ipProtection', 'IpProtection') || 0),
    barrierToEntry: Number(g('barrierToEntry', 'BarrierToEntry') || 0),
    currentTraction: Number(g('currentTraction', 'CurrentTraction') || 0),
    runwayMonths: Number(g('runwayMonths', 'RunwayMonths') || 0),
  };
}

export function getScorecardOptionLabel(options, value) {
  if (value === null || value === undefined || value === '') return '—';
  const found = options.find((o) => o.value === value);
  return found ? found.label : String(value);
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
