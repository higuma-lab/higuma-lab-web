/**
 * プロフィール（requirements.md 5、D-009）。
 * 本名・顔写真・市区町村以下の住所・勤務先名・製品名は載せない。
 */

export const PROFILE = {
  /** 表記（D-009） */
  role: 'ひぐま開発室 代表',
  /** トップページの要約 */
  summary:
    'ソフトウェア開発に長く携わってきた開発者が運営する、小さな開発室です。Windows アプリや、機器と通信して制御するソフトウェア、テストの自動化に取り組んできた経験を、Webサイト・アプリ・IT や AI のご相談に活かします。',
  /** 対応地域。所在地（都道府県）は載せない（D-039） */
  area: '全国（オンライン・メールで対応）',
  /** 開発経験。毎年の更新が要らず、手がかりを減らすため、区切りのよい年数でぼかす（D-039） */
  experienceYears: '15年以上',
  /** 経験してきたこと（勤務先名・製品名など、勤務先を推測させる記載は書かない。D-037） */
  experience: [
    'Windows アプリケーションの開発（C/C++、C#、Python）',
    '通信・制御ソフトウェア、Web API の開発',
    'ソフトウェアのテストと、その自動化',
    '開発チームでの設計・開発',
  ],
  /**
   * 主な技術（分類ごと）。実際に使ったことがあるものだけを載せる。
   * 少し触っただけのもの、勤務先を推測させる業界特有の規格・ツールは載せない（D-037・D-041）
   */
  skillGroups: [
    { label: 'プログラミング言語', skills: ['C/C++', 'C#', 'Python', 'TypeScript', 'HTML/CSS'] },
    { label: 'Windows アプリ', skills: ['.NET', 'UWP / XAML', 'MSIX・Microsoft Store'] },
    { label: 'Web', skills: ['Astro', 'Web API'] },
    { label: '通信・制御', skills: ['TCP/IP', 'HID', 'ZeroMQ'] },
    {
      label: 'テスト・CI/CD',
      skills: ['テストの自動化', 'Azure DevOps', 'GitHub Actions', 'Gitea', 'Playwright', 'Vitest'],
    },
    { label: 'クラウド', skills: ['AWS（S3・CloudFront・Route 53）', 'AWS CDK'] },
    { label: 'AI', skills: ['Claude Code', 'ChatGPT', 'Devin'] },
  ],
} as const;
