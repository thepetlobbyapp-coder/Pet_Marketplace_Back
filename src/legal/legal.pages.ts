const LAST_UPDATED = '24 May 2026';

export function renderPrivacyPolicyPage(): string {
  return renderLegalPage({
    title: 'Privacy Policy',
    description:
      'This policy describes how The Pet Lobby handles personal data in the current Pet Marketplace service.',
    body: `
      <section>
        <h2>Who we are</h2>
        <p>
          The Pet Lobby is a pet care marketplace for tutors and service
          providers. The current service is built on Supabase for account
          authentication and database storage, and a backend API hosted on
          DigitalOcean.
        </p>
      </section>
      <section>
        <h2>Data we collect</h2>
        <p>
          We collect account and authentication data such as email address,
          user ID, role, status and locale. If you use marketplace features, we
          may also process tutor or provider profile details, pet details,
          address details, provider search data, bookings and chat messages.
        </p>
        <p>
          Pet details can include name, species, breed, size, age range and
          notes. Address records can include label, country, city, postcode,
          public area label, location precision and coordinates used by the
          backend for nearby provider matching.
        </p>
        <p>
          The app does not request device location permission today. We do not
          process in-app payments in this phase.
        </p>
      </section>
      <section>
        <h2>How we use data</h2>
        <p>
          We use data to create and secure accounts, show relevant provider
          search results, manage pet profiles, create and display bookings,
          support chat where available, maintain audit records and protect the
          service from abuse.
        </p>
        <p>
          Full addresses and exact coordinates are not intended for display to
          other users. Provider search and public marketplace views should use
          limited area or approximate distance information where location is
          needed.
        </p>
      </section>
      <section>
        <h2>Sharing and processors</h2>
        <p>
          We use infrastructure and backend service providers, including
          Supabase and DigitalOcean, to operate the service. We may show limited
          information between tutors and providers when needed for marketplace
          flows such as bookings or chat.
        </p>
        <p>
          We do not sell personal data. We do not share payment data because
          in-app payments are not implemented in this phase.
        </p>
      </section>
      <section>
        <h2>Retention and deletion</h2>
        <p>
          You can request account deletion in the app or on the public
          <a href="/account-deletion">account deletion page</a>. The public
          form accepts a request without revealing whether an account exists for
          the submitted email address.
        </p>
        <p>
          Deletion requests create an operational request for review. Before
          any destructive action, account ownership must be checked. Some
          records may be kept where reasonably needed for legal obligations,
          safety, fraud prevention, dispute handling, audit integrity or service
          security. Automated deletion and anonymisation jobs are not part of
          the current implementation.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          You may use the app settings to request deletion, or use the web form
          if you no longer have the app installed. You may also stop using
          optional marketplace features that require profile, pet, booking or
          chat data.
        </p>
      </section>
    `,
  });
}

export function renderTermsPage(): string {
  return renderLegalPage({
    title: 'Terms of Use',
    description:
      'These terms describe the current rules for using The Pet Lobby Pet Marketplace service.',
    body: `
      <section>
        <h2>Service scope</h2>
        <p>
          The Pet Lobby helps tutors find pet care service providers and manage
          marketplace flows such as provider search, pet profiles, bookings and
          chat where those features are available in the current app.
        </p>
        <p>
          The service is in an early release phase. Features may be limited,
          unavailable or changed before production launch.
        </p>
      </section>
      <section>
        <h2>Accounts</h2>
        <p>
          You are responsible for the information you submit and for keeping
          your sign-in method secure. Supabase provides account authentication.
          You must not attempt to access another user's account or misuse the
          API.
        </p>
      </section>
      <section>
        <h2>Marketplace interactions</h2>
        <p>
          Tutors and providers are responsible for the arrangements they make
          through the service. Provider profiles, search results, bookings and
          chat are provided to support coordination; they are not a guarantee
          that a service will be available or suitable.
        </p>
        <p>
          In-app payments are not implemented in this phase. Any payment or
          settlement outside the app is outside the current Pet Marketplace
          transaction flow.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not submit unlawful, abusive, misleading or unsafe content. Do not
          attempt to reveal full addresses, exact coordinates or private data
          that the service is designed to protect. We may restrict access where
          reasonably needed for safety, fraud prevention, abuse handling or
          service integrity.
        </p>
      </section>
      <section>
        <h2>Account deletion</h2>
        <p>
          You can request deletion from the app settings or the public
          <a href="/account-deletion">account deletion page</a>. A request does
          not immediately delete data. We may need to verify ownership and keep
          limited records where reasonably needed for legal obligations, safety,
          fraud prevention, dispute handling, audit integrity or service
          security.
        </p>
      </section>
      <section>
        <h2>Privacy</h2>
        <p>
          Our <a href="/privacy">Privacy Policy</a> explains how the current
          service handles personal data.
        </p>
      </section>
    `,
  });
}

function renderLegalPage(input: {
  title: string;
  description: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.title} | The Pet Lobby</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8f7f4;
        --panel: #ffffff;
        --text: #1f2933;
        --muted: #5d6875;
        --accent: #2368a2;
        --border: #ded6cb;
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
        line-height: 1.6;
      }

      main {
        padding: 32px 16px;
      }

      .page {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        margin: 0 auto;
        max-width: 840px;
        padding: clamp(24px, 4vw, 44px);
      }

      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 18px;
        margin-bottom: 28px;
      }

      a {
        color: var(--accent);
        font-weight: 700;
      }

      .brand {
        color: var(--accent);
        font-size: 0.88rem;
        font-weight: 800;
        letter-spacing: 0;
        margin-bottom: 12px;
        text-transform: uppercase;
      }

      h1 {
        font-size: clamp(2.15rem, 5vw, 3.2rem);
        line-height: 1.05;
        margin: 0 0 12px;
      }

      h2 {
        font-size: 1.2rem;
        margin: 28px 0 8px;
      }

      p {
        color: var(--muted);
        font-size: 1rem;
        margin: 0 0 14px;
        overflow-wrap: anywhere;
      }

      .updated {
        color: var(--text);
        font-weight: 700;
        margin-bottom: 24px;
      }

      @media (max-width: 640px) {
        main {
          padding: 24px 16px;
        }

        .page {
          padding: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <article class="page" aria-labelledby="title">
        <nav aria-label="Legal pages">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Use</a>
          <a href="/account-deletion">Account deletion</a>
        </nav>
        <div class="brand">The Pet Lobby</div>
        <h1 id="title">${input.title}</h1>
        <p class="updated">Last updated: ${LAST_UPDATED}</p>
        <p>${input.description}</p>
        ${input.body}
      </article>
    </main>
  </body>
</html>`;
}
