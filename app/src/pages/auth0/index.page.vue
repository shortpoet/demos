<script lang="ts">
import { useHead } from '@vueuse/head';
import $ from "jquery";
import { AuthConsole } from '../../composables/console';
import Cookies from 'js-cookie';
// import { ref } from 'vue';

export default {
  setup() {
    // this triggers oauth refresh i want
    // this needs to be added to pages that use auth0
    useHead({
      // TODO look into how the title affects back button text
      script: [
        {
          src: "https://cdn.auth0.com/js/auth0/9.13.2/auth0.min.js",
          async: true,
          defer: true,
          onload: async () => {
            console.log('auth0 loaded');
            const { HTMLConsole } = await import('../../composables/console');
            const htmlConsole = new HTMLConsole({
              selector: '#console'
            });
            if (typeof window !== "undefined") {

              const REDIRECT_URL = window.location.origin;
              setConfig(REDIRECT_URL);
              onLoad(htmlConsole, REDIRECT_URL);
            }

          },
        },
      ],
    });
  },
};

// import { HTMLConsole, AuthConsole } from '../../composables/auth';

// const htmlConsole = new HTMLConsole({
//   selector: '#console'
// });

// const REDIRECT_URL = window.location.origin;

// let webAuth;
// let webAuthPasswordless;
let organization;


function setConfig(REDIRECT_URL: string) {
  const $domainInput = $('#config-domain');
  const $clientIdInput = $('#config-client-id');
  const $clientIdPwl = $('#config-client-id-pwl');
  const $userEmailInput = $('#config-user-email');
  const $userPwdInput = $('#config-user-password');
  const $configOrganization = $('#config-organization');


  const domain =
    $domainInput.val() ||
    Cookies.get('auth0_domain') ||
    `${import.meta.env.VITE_AUTH0_DOMAIN}`;
  const clientId =
    $clientIdInput.val() ||
    Cookies.get('auth0_client_id') ||
    `${import.meta.env.VITE_AUTH0_CLIENT_ID}`;
  const clientIdPwl =
    $clientIdPwl.val() ||
    Cookies.get('auth0_client_id_pwl') ||
    `${import.meta.env.VITE_AUTH0_CLIENT_ID}`;
  const userEmail =
    $userEmailInput.val() ||
    Cookies.get('auth0_user_email') ||
    'johnfoo@gmail.com';
  const userPass =
    $userPwdInput.val() || Cookies.get('auth0_user_pw') || '1234';
  const configOrganization =
    $configOrganization.val() ||
    Cookies.get('auth0_config_organization') ||
    'shortpoet';

  const webAuthConfig = {
    domain: domain,
    redirectUri: REDIRECT_URL,
    clientID: clientId,
    // plugins: [new CordovaAuth0Plugin()],
    scope: 'openid profile email',
    responseType: 'token id_token',
    leeway: 60,
  };

  console.log('webAuthConfig', webAuthConfig);

  window.webAuth = new window.auth0.WebAuth(webAuthConfig);

  const configPwless = {
    domain: domain,
    redirectUri: REDIRECT_URL,
    clientID: clientIdPwl,
    scope: 'openid profile email',
    responseType: 'token id_token',
    leeway: 60,
  }
  window.webAuthPasswordless = new window.auth0.WebAuth(configPwless);

  Cookies.set('auth0_domain', domain.toString());
  Cookies.set('auth0_client_id', clientId.toString());
  Cookies.set('auth0_client_id_pwl', clientIdPwl.toString());
  Cookies.set('auth0_user_email', userEmail.toString());
  Cookies.set('auth0_user_pw', userPass.toString());

  if (configOrganization) {
    Cookies.set('auth0_config_organization', configOrganization.toString());
    organization = configOrganization;
  }

  $domainInput.val(domain);
  $clientIdInput.val(clientId);
  $clientIdPwl.val(clientIdPwl);

  if (configOrganization) {
    $configOrganization.val(configOrganization);
  }

  $('.update-user-email').each(function (index, el) {
    $(el).val(userEmail);
  });

  $('.update-user-password').each(function (index, el) {
    $(el).val(userPass);
  });
}

function onLoad(htmlConsole: AuthConsole, REDIRECT_URL: string) {
  let organization: string | null = null;

  window.webAuth.parseHash(function (err: any, data: any) {
    console.log(err, data);
    if (err) {
      htmlConsole.dumpCallback(err, null);
      window.location.hash = '';
      return;
    }

    if (data) {
      htmlConsole.dumpCallback(null, data);

      if (data.accessToken) {
        window.webAuth.client.userInfo(
          data.accessToken,
          htmlConsole.dumpCallback.bind(htmlConsole)
        );
      }
    }

    window.location.hash = '';
  });

  $('#clear-console').click(function () {
    $('#clear-console').removeClass('icon-budicon-498');
    $('#clear-console').addClass('icon-budicon-495');

    htmlConsole.clear();

    setTimeout(function () {
      $('#clear-console').removeClass('icon-budicon-495');
      $('#clear-console').addClass('icon-budicon-498');
    }, 250);
  });

  $('#config-update').click(function (e) {
    e.preventDefault();
    setConfig(REDIRECT_URL);
  });

  $('#clear-org').click(function (e) {
    e.preventDefault();

    Cookies.remove('auth0_config_organization');
    $('#config-organization').val('');
    organization = null;
    setConfig(REDIRECT_URL);
  });

  $('#invoke-invite').click(function (e) {
    e.preventDefault();

    var inviteUrl = prompt('Paste in the user invitation URL:');

    if (inviteUrl) {
      var url = new URL(inviteUrl);
      var params = new URLSearchParams(url.search);

      window.webAuth.authorize({
        // organization: params.get('organization'),
        invitation: params.get('invitation')
      });
    }
  });

  $('.login-db').click(function (e) {
    e.preventDefault();
    window.webAuth.login(
      {
        username: $('.login-username').val(),
        password: $('.login-password').val()
      },
      htmlConsole.dumpCallback.bind(htmlConsole)
    );
  });

  $('.passwordless-login-verify').click(function (e) {
    e.preventDefault();
    window.webAuthPasswordless.passwordlessLogin(
      {
        connection: 'email',
        email: $('.passwordless-login-username').val(),
        verificationCode: $('.passwordless-login-code').val()
      },
      htmlConsole.dumpCallback.bind(htmlConsole)
    );
  });

  $('.passwordless-login-db').click(function (e) {
    e.preventDefault();
    window.webAuthPasswordless.passwordlessStart(
      {
        connection: 'email',
        email: $('.passwordless-login-username').val(),
        send: 'code'
      },
      htmlConsole.dumpCallback.bind(htmlConsole)
    );
  });

  let popupHandler;

  $('.popup-login-db-preload').click(function (e) {
    e.preventDefault();
    popupHandler = window.webAuth.popup.preload();
  });

  $('.popup-login-db').click(function (e) {
    e.preventDefault();

    window.webAuth.popup.loginWithCredentials(
      {
        connection: $('#popup-login-connection').val(),
        username: $('.popup-login-username').val(),
        password: $('.popup-login-password').val()
      },
      htmlConsole.dumpCallback.bind(htmlConsole)
    );
  });

  $('.client-login-db').click(function (e) {
    e.preventDefault();
    window.webAuth.client.login(
      {
        realm: $('#client-login-realm').val(),
        username: $('.client-login-username').val(),
        password: $('.client-login-password').val()
      },
      function (err: any, data: any) {
        htmlConsole.dumpCallback.bind(htmlConsole)(err, data);
        window.webAuth.client.userInfo(
          data.accessToken,
          htmlConsole.dumpCallback.bind(htmlConsole)
        );
      }
    );
  });

  $('.login-facebook').click(function (e) {
    e.preventDefault();

    var config = { connection: 'facebook', };

    // if (organization) {
    //   config.organization = organization;
    // }

    window.webAuth.authorize(config);
  });

  $('.login-hosted').click(function (e) {
    e.preventDefault();

    var config = {};

    // if (organization) {
    //   config.organization = organization;
    // }

    window.webAuth.authorize(config);
  });

  $('.login-twitter').click(function (e) {
    e.preventDefault();

    var config = { connection: 'twitter', };

    // if (organization) {
    //   config.organization = organization;
    // }

    window.webAuth.authorize(config);
  });

  $('.login-github').click(function (e) {
    e.preventDefault();

    var config = { connection: 'github', };

    // if (organization) {
    //   config.organization = organization;
    // }

    window.webAuth.authorize(config);
  });

  $('.popup-login-facebook').click(function (e) {
    e.preventDefault();

    var options = {
      redirectURI: REDIRECT_URL + '/auth/callback',
      connection: 'facebook',
      // organization: ''
    };

    // if (organization) {
    //   options.organization = organization;
    // }

    window.webAuth.popup.authorize(
      options,
      htmlConsole.dumpCallback.bind(htmlConsole)
    );
  });

  $('.popup-login-hosted').click(function (e) {
    e.preventDefault();

    var options = {
      redirectURI: REDIRECT_URL + '/auth/callback',
      // organization: ''
    };

    // if (organization) {
    //   options.organization = organization;
    // }

    window.webAuth.popup.authorize(
      options,
      htmlConsole.dumpCallback.bind(htmlConsole)
    );
  });

  $('.popup-login-twitter').click(function (e) {
    e.preventDefault();

    var options = {
      connection: 'twitter',
      redirectURI: REDIRECT_URL + '/auth/callback',
      // organization: ''
    };

    // if (organization) {
    //   options.organization = organization;
    // }

    window.webAuth.popup.authorize(
      options,
      htmlConsole.dumpCallback.bind(htmlConsole)
    );
  });

  $('.popup-login-github').click(function (e) {
    e.preventDefault();

    var options = {
      connection: 'github',
      redirectURI: REDIRECT_URL + '/auth/callback',
      // organization: ''
    };

    // if (organization) {
    //   options.organization = organization;
    // }

    window.webAuth.popup.authorize(
      options,
      htmlConsole.dumpCallback.bind(htmlConsole)
    );
  });

  $('.logout').click(function (e) {
    e.preventDefault();
    window.webAuth.logout({ returnTo: REDIRECT_URL });
  });

  $('.renew-auth').click(function (e) {
    e.preventDefault();
    window.webAuth.renewAuth(
      {
        usePostMessage: true,
        redirectURI: REDIRECT_URL + '/auth/callback'
      },
      htmlConsole.dumpCallback.bind(htmlConsole)
    );
  });

  $('.token-endpoint').click(function (e) {
    e.preventDefault();

    var params = new URLSearchParams(window.location.search);

    if (params.get('code')) {
      window.webAuth.client.oauthToken(
        {
          code: params.get('code'),
          grantType: 'authorization_code',
          redirectUri: window.location.origin
        },
        function (err: any, data: any) {
          history.pushState({}, '', '/');
          htmlConsole.dumpCallback(err, data);
        }
      );
    }
  });

  $('.web-message-check-session').click(function (e) {
    e.preventDefault();
    const configPwless = {
      domain: Cookies.get('auth0_domain'),
      redirectUri: REDIRECT_URL,
      clientID: Cookies.get('auth0_client_id'),
      responseType: 'token'
    }
    window.webAuth.checkSession({}, htmlConsole.dumpCallback.bind(htmlConsole));
  });

  $('.getssodata').click(function (e) {
    e.preventDefault();
    window.webAuth.client.getSSOData(htmlConsole.dumpCallback.bind(htmlConsole));
  });

  $(document.body).append($('<div class="loaded">LOADED</div>'));

}

</script>
<style>
.row {
  margin: 10px 0;
}

pre {
  margin: 0 0 10px 0;
  min-height: 300px;
}

code {
  min-height: 300px;
}

h2 {
  margin: 20px 0;
}

code span {
  color: red;
}

code details {
  padding: 5px;
  border-radius: 4px;
}

code details p {
  margin: 5px 0 0 0;
}

code details.error {
  background: rgba(255, 0, 0, 0.1);
}

#clear-console {
  cursor: pointer;
}
</style>
<template>
  <div class="container">
    <div class="row">
      <div class="col-xs-12">
        <h1>Auth0.JS playground</h1>
      </div>
      <div class="col-xs-6">
        <h2>Actions</h2>

        <hr />

        <div>
          <h4>Login with username and password:</h4>
          <p>
            <input class="form-control login-username update-user-email" value="" />
          </p>
          <p>
            <input class="form-control login-password update-user-password" value="" />
          </p>
          <p>
            <input type="button" class="btn btn-default login-db" value="login" />
          </p>
        </div>

        <hr />

        <div>
          <h4>Login with passwordless connection:</h4>
          <div>
            <p>
              <input class="form-control passwordless-login-username update-user-email" value="" type="email" />
            </p>
            <p>
              <input type="button" class="btn btn-default passwordless-login-db" value="login" />
            </p>
          </div>
          <div>
            <p>
              <input class="form-control passwordless-login-code" value="" />
            </p>
            <p>
              <input type="button" class="btn btn-default passwordless-login-verify" value="verify" />
            </p>
          </div>
        </div>

        <hr />

        <div>
          <h4>Login with database connection (popup):</h4>
          <p>
            <input class="form-control" id="popup-login-connection" value=""
              placeholder="Connection name; leave blank to use tenant default" />
          </p>
          <p>
            <input class="form-control popup-login-username update-user-email" value="" />
          </p>
          <p>
            <input class="form-control popup-login-password update-user-password" value="" />
          </p>
          <p>
            <input type="button" class="btn btn-default popup-login-db-preload" value="preload" />
            <input type="button" class="btn btn-default popup-login-db" value="login" />
          </p>
        </div>

        <hr />

        <div>
          <h4>Login with database connection (client login):</h4>
          <p>
            <input class="form-control" id="client-login-realm" value=""
              placeholder="Realm name; leave blank to use tenant default" />
          </p>
          <p>
            <input class="form-control client-login-username update-user-email" value="" placeholder="User email" />
          </p>
          <p>
            <input class="form-control client-login-password update-user-password" value="" placeholder="User password" />
          </p>
          <p>
            <input type="button" class="btn btn-default client-login-db" value="login" />
          </p>
        </div>

        <hr />

        <div>
          <h4>Login with /authorize:</h4>
          <p>
            <input type="button" class="btn btn-default btn-sm login-hosted" value="Hosted login page" />
            <input type="button" class="btn btn-default btn-sm login-facebook" value="Facebook" />
            <input type="button" class="btn btn-default btn-sm login-twitter" value="Twitter" />
            <input type="button" class="btn btn-default btn-sm login-github" value="Github" />
          </p>
        </div>

        <hr />

        <div>
          <h4>Login with /authorize (popup):</h4>
          <input type="button" class="btn btn-default btn-sm popup-login-hosted" value="Hosted login page" />
          <input type="button" class="btn btn-default btn-sm popup-login-facebook" value="Facebook" />
          <input type="button" class="btn btn-default btn-sm popup-login-twitter" value="Twitter" />
          <input type="button" class="btn btn-default btn-sm popup-login-github" value="Github" />
        </div>

        <hr />

        <div>
          <h4>Renew authentication:</h4>
          <input type="button" class="btn btn-default renew-auth" value="Renew" />
        </div>

        <hr />

        <div>
          <h4>Call token endpoint</h4>
          <input type="button" value="Get token" class="btn btn-default token-endpoint" />
        </div>

        <hr />

        <div>
          <h4>Check if you have an active session:</h4>
          <input type="button" class="btn btn-default web-message-check-session" value="Check session" />
        </div>

        <hr />

        <div>
          <h4>
            Get information about the last successful authorization request
          </h4>
          <input type="button" class="btn btn-default getssodata" value="Get SSO data" />
        </div>

        <hr />

        <div>
          <h4>SSO Logout:</h4>
          <input type="button" class="btn btn-default logout" value="Logout" />
        </div>

        <hr />

        <h2>Config</h2>

        <div>
          <h4>Domain:</h4>
          <input class="form-control" id="config-domain" value="" />

          <h4>Client ID:</h4>
          <input class="form-control" id="config-client-id" value="" />

          <h4>Client ID (passwordless):</h4>
          <input class="form-control" id="config-client-id-pwl" value="" />

          <h4>User email:</h4>
          <input class="form-control update-user-email" id="config-user-email" type="email" value="" />

          <h4>User password:</h4>
          <input class="form-control update-user-password" id="config-user-password" value="" />

          <h4>Organization ID</h4>
          <p>
            This is only applicable when logging in using the Universal Login
            Page.
          </p>
          <div style="display: flex">
            <input type="text" class="form-control update-organization" id="config-organization"
              style="margin-right: 10px;" />
            <input type="button" class="btn btn-default" id="clear-org" value="Clear" />
          </div>

          <h4>User Invitation</h4>
          <p>Paste in an invitation URL and be logged in</p>
          <div>
            <input type="button" value="Test User Invitation" class="btn btn-default" id="invoke-invite" />
          </div>

          <br />
          <input type="button" class="btn btn-default" id="config-update" value="Update" />
        </div>
      </div>

      <div class="col-xs-6">
        <h4>Console:</h4>
        <pre><code id="console"></code></pre>
        <div class="text-right">
          <i id="clear-console" aria-hidden="true" class="icon-budicon-498 icon">Clear</i>
        </div>
      </div>
    </div>
  </div>
</template>