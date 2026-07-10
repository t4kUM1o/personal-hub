# Personal Hub

個人用の統合Webサイト。Public（一般公開）/ Private（ログイン後）/ Admin（管理画面）の3層構成。

## Step 1 で実装したもの

- ディレクトリ構成（Public / Private / Admin をルーティング単位で分離）
- Docker Compose 雛形（Next.js アプリ + PostgreSQL + Adminer）
- Prisma によるDB接続確認（`/api/health`）
- 各ページのプレースホルダー（中身は未実装、ルーティング疎通のみ）

## Step 2 で実装したもの（認証: メール+パスワード）

- `User` / `Session` モデル追加（`prisma/schema.prisma`）
- パスワードハッシュ化（bcryptjs）
- DBで管理するセッション方式でのログイン/ログアウト（`/api/auth/login` `/api/auth/logout` `/api/auth/me`）
- `(private)` `admin` レイアウトへの実際のアクセスガード（未ログイン→`/login`、権限不足→`/dashboard`）
- 初回管理者アカウント作成用のシードスクリプト（`prisma/seed.cjs`）

**あえて今回やらないと決めたこと**
- 公開の会員登録フォーム（「自分専用サイト」の前提でリスクの方が大きいため。管理者はシードスクリプトで作成）
- Google/GitHub OAuth、2段階認証(TOTP)、バックアップコード、ログイン履歴画面、デバイス管理画面、ログインのレート制限
  → `Session` に `userAgent` / `ipAddress` は今のうちから持たせてあるので、後で履歴画面を追加する際にスキーマ変更は不要です

## 技術スタック

| 分類 | 選定 | 理由 |
|---|---|---|
| フレームワーク | Next.js 15 (App Router) | フロント/APIを1リポジトリで完結でき、個人開発の運用コストが低い |
| 言語 | TypeScript | 仕様書の「型安全を維持する」要件に対応 |
| DB | PostgreSQL 16 | 家計簿の集計・将来の分析用途に強い |
| ORM | Prisma | スキーマ駆動でマイグレーション管理がしやすく、型安全なクエリが書ける |
| スタイル | Tailwind CSS | レスポンシブ・ダークモード・角丸カードUIを仕様書通り実装しやすい |
| コンテナ | Docker Compose (standalone build) | Proxmox上での運用を前提とした軽量本番イメージ |

## ディレクトリ構成

```
personal-hub/
├── docker-compose.yml       # app / db / adminer の3サービス
├── Dockerfile                # マルチステージビルド（standalone出力）
├── .env.example               # 環境変数テンプレート
├── prisma/
│   └── schema.prisma          # DBスキーマ（Step1はUserモデルのみ）
└── src/
    ├── app/
    │   ├── (public)/           # 認証不要: TOP / ブログ / プロフィール / 制作物 / お問い合わせ
    │   ├── (private)/          # ログイン必須: ダッシュボード / 家計簿 / TODO / カレンダー / 監視系 / 設定
    │   ├── admin/               # 管理者権限必須: 実URLセグメント /admin/* （保護しやすくするため意図的にroute groupではなく実パスにしています）
    │   └── api/health/          # DB接続確認用エンドポイント
    ├── lib/
    │   ├── prisma.ts            # PrismaClientシングルトン
    │   └── env.ts                # 環境変数バリデーション
    └── components/ui/           # 共通UIコンポーネント（現状はPagePlaceholderのみ）
```

### 設計上の判断メモ

- **`(public)` `(private)` はNext.jsのroute group（URLに影響しない）、`admin` は実セグメント**
  `(admin)` のままだと `/blog` が公開ブログ管理ページとURL衝突したため、実パス化しました。副次効果として `middleware.ts` の matcher で `/admin/:path*` を1行で保護できるようになります。
- **Private側はroute groupのまま（URLプレフィックスなし）**
  `/dashboard` `/kakeibo` のようにフラットなURLの方が使いやすく、現時点で他ページとの衝突もないためこのままにしています。認証ガードはミドルウェアで対象パスを列挙する形になります。
- **PagePlaceholderコンポーネント**
  Step1では全ページが「未実装」表示のみですが、共通コンポーネント化してあるので後で実UIに差し替える際の変更箇所が1つで済みます（拡張性優先のルールに対応）。
- **`/api/health` はエラー詳細をレスポンスに含めない**
  DB接続失敗時、スタックトレースはサーバーログにのみ出力し、クライアントには `status: "error"` のみ返します（セキュリティ要件の「エラー処理を適切に行う」に対応）。

## ローカルでの動かし方

```bash
cp .env.example .env
# .env の POSTGRES_PASSWORD / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD を変更してください
# パスワードは記号を避けるか、迷ったら: openssl rand -hex 24

docker compose up --build -d
```

起動後、スキーマをDBに反映し、最初の管理者アカウントを作成します（初回のみ・スキーマ変更のたびに1つ目は再実行）。

```bash
docker compose run --rm migrate npx prisma db push
docker compose run --rm migrate node prisma/seed.cjs
```

疎通確認:

- アプリ本体: http://localhost:3000
- DB接続確認: http://localhost:3000/api/health → `{"status":"ok","db":"connected",...}`
- ログイン: http://localhost:3000/login → `.env` の `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` でログインできれば成功
- Adminer（DB中身の確認用、本番では公開しないこと）: http://localhost:8080

## 既知の注意点（このチャットの検証環境固有）

この回答を作った検証用サンドボックスは外部ネットワークが許可リスト制になっており、Prismaのクエリエンジンバイナリの配布元 `binaries.prisma.sh` がリストに含まれていないため、`prisma generate` がここでは失敗します。TypeScriptの型チェックと `next build` のコンパイル自体は成功済みなので、コードの問題ではありません。実際にご自身の環境（Proxmox / 通常のPC）で `docker compose up --build` を実行する際は、フルにインターネットへアクセスできるため問題なく `prisma generate` が完了します。

## 次に実装する内容（提案）

1. ~~認証システム（メール+パスワード）~~ → **Step 2で実装済み**
2. **ブログ機能のDBスキーマ**: Post / Category / Tag モデル設計とPublic側の一覧・詳細ページ実装
3. **家計簿のDBスキーマ**: Transaction / Account / Category モデル設計と収支入力UI
4. **認証の強化**: パスワードリセット / メール認証 / 2段階認証(TOTP) / ログイン履歴画面 / レート制限（Step 2で意図的に見送った分）

どれから着手しますか？
