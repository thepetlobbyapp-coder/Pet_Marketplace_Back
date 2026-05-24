export type AccountDeletionPageState =
  | 'form'
  | 'submitted'
  | 'invalid'
  | 'error';

export function renderAccountDeletionPage(
  state: AccountDeletionPageState,
): string {
  const submitted = state === 'submitted';
  const invalid = state === 'invalid';
  const error = state === 'error';

  return `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Request account deletion | Pet Marketplace</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f3ee;
        --panel: #fffdfa;
        --text: #1f2933;
        --muted: #5d6875;
        --accent: #2368a2;
        --accent-strong: #194d78;
        --border: #ded6cb;
        --success: #0f766e;
        --warning: #9a5b13;
        --danger: #b42318;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        line-height: 1.5;
      }

      main {
        display: grid;
        min-height: 100vh;
        place-items: center;
        padding: 32px 16px;
      }

      .page {
        max-width: 720px;
        min-width: 0;
        width: 100%;
      }

      .brand {
        color: var(--accent-strong);
        font-size: 0.88rem;
        font-weight: 800;
        letter-spacing: 0;
        margin-bottom: 16px;
        text-transform: uppercase;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: clamp(24px, 4vw, 40px);
      }

      h1 {
        font-size: 3.25rem;
        line-height: 1;
        margin: 0 0 16px;
      }

      p {
        color: var(--muted);
        font-size: 1rem;
        margin: 0 0 16px;
        overflow-wrap: anywhere;
      }

      .notice {
        border-left: 4px solid var(--success);
        color: var(--text);
        margin: 0 0 24px;
        padding: 12px 14px;
      }

      .notice.warning {
        border-left-color: var(--warning);
      }

      .notice.error {
        border-left-color: var(--danger);
      }

      form {
        display: grid;
        gap: 16px;
        margin-top: 24px;
      }

      label {
        color: var(--text);
        display: grid;
        font-weight: 700;
        gap: 8px;
      }

      input[type="email"] {
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        font: inherit;
        min-height: 48px;
        padding: 12px 14px;
        min-width: 0;
        width: 100%;
      }

      .checkbox {
        align-items: start;
        display: grid;
        gap: 10px;
        grid-template-columns: 20px 1fr;
      }

      input[type="checkbox"] {
        height: 20px;
        margin: 3px 0 0;
        width: 20px;
      }

      button {
        background: var(--accent);
        border: 0;
        border-radius: 8px;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        min-height: 48px;
        min-width: 0;
        padding: 12px 18px;
      }

      button:hover,
      button:focus-visible {
        background: var(--accent-strong);
      }

      .legal-links {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 18px;
        margin-top: 20px;
      }

      a {
        color: var(--accent);
        font-weight: 700;
      }

      .fine-print {
        font-size: 0.92rem;
        margin-top: 20px;
      }

      @media (max-width: 640px) {
        main {
          padding: 24px 16px;
        }

        h1 {
          font-size: 2.3rem;
        }

        .panel {
          padding: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="page" aria-labelledby="title">
        <div class="brand">Pet Marketplace</div>
        <div class="panel">
          <h1 id="title">Request account deletion</h1>
          ${submitted ? successNotice() : ''}
          ${invalid ? invalidNotice() : ''}
          ${error ? errorNotice() : ''}
          <p>
            Use this form if you no longer have the app installed and want to
            request deletion of your Pet Marketplace account and associated
            data.
          </p>
          <p>
            This form creates an operational request only. Account ownership is
            checked before any destructive action, and some records may be kept
            where required for legal, safety or fraud-prevention reasons.
          </p>
          <form method="post" action="/api/v1/account-deletion/request">
            <input type="hidden" name="responseMode" value="web" />
            <label>
              Email address used for your account
              <input
                autocomplete="email"
                inputmode="email"
                maxlength="254"
                name="email"
                required
                type="email"
              />
            </label>
            <label class="checkbox">
              <input name="confirm" required type="checkbox" value="true" />
              <span>
                I understand this records a request and does not immediately
                delete my data.
              </span>
            </label>
            <button type="submit">Submit deletion request</button>
          </form>
          <p class="fine-print">
            For privacy, the confirmation does not reveal whether an account
            exists for the email address submitted.
          </p>
          <nav class="legal-links" aria-label="Legal pages">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Use</a>
          </nav>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

function successNotice(): string {
  return `<p class="notice" role="status">
    If the email belongs to a Pet Marketplace account, the deletion request has
    been received. You do not need to submit it again.
  </p>`;
}

function invalidNotice(): string {
  return `<p class="notice warning" role="alert">
    Check the email address and confirmation box, then submit the request again.
  </p>`;
}

function errorNotice(): string {
  return `<p class="notice error" role="alert">
    The request could not be submitted right now. Please try again later.
  </p>`;
}
