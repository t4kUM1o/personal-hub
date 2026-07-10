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

## Step 3 で実装したもの（パスワードリセット）

- `PasswordResetToken` モデル追加（Sessionと同じ「トークンのハッシュのみDB保存」方式）
- Gmail SMTP（アプリパスワード）でのメール送信（`src/lib/mail.ts`）
- `/forgot-password` → メール送信 → `/reset-password?token=...` → 新パスワード設定の一連の画面
- パスワードリセット成功時、既存の全ログインセッションを自動的に無効化（乗っ取り対策）
- メールアドレスの登録有無を外部から推測されないよう、`/api/auth/forgot-password` は常に同じレスポンスを返す

**あえて今回やらないと決めたこと**
- メール認証（登録確認メール）: 公開の会員登録フォームが無いため出番が無い。招待制ユーザー機能を作る時に着手
- リセット申請自体のレート制限（Step 2から持ち越し中の「ログインのレート制限」と合わせて後日まとめて対応）

## Step 4 で実装したもの（ログイン履歴・デバイス管理）

- `Session`に`revokedAt`を追加。ログアウトは**削除ではなく無効化フラグを立てる方式**に変更（履歴を残すため）
- `/settings` にログイン履歴・デバイス一覧を表示（状態・IPアドレス・User-Agent・ログイン日時・有効期限）
- 使用中デバイス以外を選んで「ログアウトさせる」ボタンで強制的に無効化できる（`/api/auth/sessions/revoke`、他人のセッションは操作不可）
- パスワードリセット時の全セッション無効化も同じ「無効化フラグ」方式に統一（削除だと履歴が消えてしまうため）

**あえて今回やらないと決めたこと**
- User-Agentの詳細パース（「Chrome on Windows」のような表示）: 専用ライブラリが必要になるため、今は生の文字列をそのまま表示
- 古い履歴の自動削除: 今のところ増える一方だが、個人利用の量なら当面問題にならない見込み。将来的に必要になれば追加

## Step 5 で実装したもの（ブログ機能）

- `Post` / `Category` / `Tag` / `PostTag` モデル追加
- 管理画面（`/admin/blog`）: 記事の作成・編集・削除（Markdown入力、下書き/公開の切り替え）、カテゴリー管理、タグ管理
- 公開側（`/blog`）: 公開済み記事の一覧・詳細ページ。Markdown→HTML変換 + サニタイズ（`marked` + `isomorphic-dompurify`）
- OGP用のメタデータ（`generateMetadata`でタイトル・概要・公開日時を出力）
- Tailwind Typography プラグインで記事本文を読みやすく整形

**あえて今回やらないと決めたこと**（次のブログ関連ステップ用に温存）
- 画像アップロード、コードのシンタックスハイライト、目次自動生成、関連記事、コメント機能
- RSS、サイトマップ、パンくずリスト
- 公開予約（今は「公開」を選ぶと即座に公開扱いになる）
- 記事検索、カテゴリ/タグ別の絞り込みページ（一覧に表示はされるが、クリックしての絞り込みはまだ）

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
#
# パスワードリセット機能を使うなら、GMAIL_USER / GMAIL_APP_PASSWORD / APP_BASE_URL も設定してください
# (APP_BASE_URL は今アクセスしているURL、例: http://192.168.1.5:3000)

docker compose up --build -d
```

起動後、スキーマをDBに反映し、最初の管理者アカウントを作成します（初回のみ・スキーマ変更のたびに1つ目は再実行）。

```bash
docker compose run --rm migrate npx prisma db push
docker compose run --rm migrate node prisma/seed.cjs
```

⚠️ `migrate`サービスは`--build`を付けないと**古いイメージのまま使い回されます**。`app`は`up --build`で毎回作り直りますが、`migrate`は別イメージなので、スキーマを変更した後は必ず `docker compose run --rm --build migrate ...` のように `--build` を付けてください。

疎通確認:

- アプリ本体: http://localhost:3000
- DB接続確認: http://localhost:3000/api/health → `{"status":"ok","db":"connected",...}`
- ログイン: http://localhost:3000/login → `.env` の `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` でログインできれば成功
- Adminer（DB中身の確認用、本番では公開しないこと）: http://localhost:8080

## 既知の注意点（このチャットの検証環境固有）

この回答を作った検証用サンドボックスは外部ネットワークが許可リスト制になっており、Prismaのクエリエンジンバイナリの配布元 `binaries.prisma.sh` がリストに含まれていないため、`prisma generate` がここでは失敗します。TypeScriptの型チェックと `next build` のコンパイル自体は成功済みなので、コードの問題ではありません。実際にご自身の環境（Proxmox / 通常のPC）で `docker compose up --build` を実行する際は、フルにインターネットへアクセスできるため問題なく `prisma generate` が完了します。

## 次に実装する内容（提案）

1. ~~認証システム（メール+パスワード）~~ → **Step 2で実装済み**
2. ~~パスワードリセット・メール認証~~ → **Step 3で実装済み**
3. ~~ログイン履歴・デバイス管理~~ → **Step 4で実装済み**
4. ~~ブログ機能（基本のCRUD・公開ページ）~~ → **Step 5で実装済み**
5. **ブログ機能の続き**: 画像アップロード / シンタックスハイライト / RSS / サイトマップ / 検索・絞り込み
6. **家計簿のDBスキーマ**: Transaction / Account / Category モデル設計と収支入力UI
7. **認証の残り**: ログインのレート制限 / 2段階認証(TOTP)

どれから着手しますか？
