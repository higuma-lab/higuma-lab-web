# NoteFlip のストア用ページ

NoteFlip（Windows 向け楽譜 PDF ビューアー）の Microsoft Store 用ページ。D-024 により、このリポジトリを原本とする。

- 取り込み元：`higuma-lab/NoteFlip` の `docs/store/site/`（コミット `1a16e11`、2026-10-08 時点）
- **Phase 5 でサイトのコンテンツに移した。原本は `src/content/apps/noteflip/`**（Jekyll の変数はサイトの設定値に置き換え済み。取り込み時の原稿は git の履歴にある）

| ファイル | 内容 | URL |
|---|---|---|
| `privacy.ja.md` | プライバシーポリシー（日本語） | `/apps/noteflip/privacy/` |
| `privacy.en.md` | Privacy Policy（英語） | `/apps/noteflip/en/privacy/` |
| `support.ja.md` | サポート（日本語） | `/apps/noteflip/support/` |
| `support.en.md` | Support（英語） | `/apps/noteflip/en/support/` |

## 更新するとき

アプリがデータの扱いを変えたとき（保存するもの、通信、ログの中身、外部サービスなど）は、このページも更新し、front matter の `updatedAt`（最終更新日）を変える。日英の両方を直す。
NoteFlip 側のリリース手順に、このページの更新要否の確認を入れておく。
