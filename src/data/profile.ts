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
  /** TODO: 活動地域（都道府県）を確定して設定する（D-009） */
  area: undefined as string | undefined,
  /** TODO: 経験年数を確定して設定する（D-009） */
  years: undefined as number | undefined,
  /** 経験してきたこと（勤務先名・製品名など、勤務先を推測させる記載は書かない。D-037） */
  experience: [
    'Windows アプリケーションの開発（C/C++、C#、Python）',
    '通信・制御ソフトウェア、Web API の開発',
    'ソフトウェアのテストと、その自動化',
    '開発チームでの設計・開発',
  ],
  /** TODO: 掲載するスキルをオーナーが確認する（TypeScript・Astro・AWS はこのサイトで使用） */
  skills: ['C/C++', 'C#', 'Python', 'TypeScript', 'Astro', 'AWS'],
} as const;
