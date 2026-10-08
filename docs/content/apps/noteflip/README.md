# NoteFlip のストア用ページ（原稿）

NoteFlip（Windows 向け楽譜 PDF ビューアー）の Microsoft Store 用ページの原稿。D-024 により、このリポジトリを原本とする。

- 取り込み元：`higuma-lab/NoteFlip` の `docs/store/site/`（コミット `1a16e11`、2026-10-08 時点）
- 取り込んだ時点の内容をそのまま置いている。Jekyll の変数（`{{ site.publisher }}`、`{{ site.support_email }}`）は Phase 5 でサイトの設定値に置き換える。

| ファイル | 内容 | 公開予定の URL |
|---|---|---|
| `privacy.ja.md` | プライバシーポリシー（日本語） | `/apps/noteflip/privacy/` |
| `privacy.en.md` | Privacy Policy（英語） | `/apps/noteflip/en/privacy/` |
| `support.ja.md` | サポート（日本語） | `/apps/noteflip/support/` |
| `support.en.md` | Support（英語） | `/apps/noteflip/en/support/` |

## 更新するとき

アプリがデータの扱いを変えたとき（保存するもの、通信、ログの中身、外部サービスなど）は、このページも更新し、「最終更新日」を変える。
NoteFlip 側のリリース手順に、このページの更新要否の確認を入れておく。
