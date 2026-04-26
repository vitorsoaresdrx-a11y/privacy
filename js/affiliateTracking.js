(() => {
    const COOKIE_NAME = '_prv_aff';
    const COOKIE_MAX_AGE = 604800; // 7 days
    const COOKIE_MAX_AGE_UNAUTH = 300; // 5 minutes
    const PAYMENT_EVENT_CONTENT_PAID = 'payment-event__content-paid';

    function writeCookie(affId, affTp, affC, maxAge, upgraded) {
        const value = encodeURIComponent(JSON.stringify({
            aff_id: affId,
            aff_tp: affTp,
            aff_c: affC || null,
            upgraded: !!upgraded
        }));
        document.cookie = `${COOKIE_NAME}=${value}; Path=/; Secure; SameSite=Lax; Max-Age=${maxAge}`;
    }

    function deleteCookie() {
        document.cookie = `${COOKIE_NAME}=; Path=/; Secure; SameSite=Lax; Max-Age=0`;
    }

    function readCookie() {
        const match = document.cookie.split('; ').find(c => c.startsWith(COOKIE_NAME + '='));
        if (!match) return null;
        try {
            return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
        } catch {
            return null;
        }
    }

    function clearAffiliateParams() {
        const current = new URLSearchParams(window.location.search);
        current.delete('aff_id');
        current.delete('aff_tp');

        const returnUrl = current.get('ReturnUrl');
        if (returnUrl) {
            const qIdx = returnUrl.indexOf('?');
            if (qIdx !== -1) {
                const innerParams = new URLSearchParams(returnUrl.substring(qIdx));
                innerParams.delete('aff_id');
                innerParams.delete('aff_tp');
                const innerSearch = innerParams.toString();
                current.set('ReturnUrl', returnUrl.substring(0, qIdx) + (innerSearch ? '?' + innerSearch : ''));
            }
        }

        const newSearch = current.toString();
        history.replaceState(null, '', window.location.pathname + (newSearch ? '?' + newSearch : ''));
    }

    function extractCreatorFromPath(pathname) {
        if (!pathname) return null;
        const clean = pathname.split('?')[0];
        const patterns = [
            /^\/profile\/([^\/]+)/i,
            /^\/checkout\/([^\/]+)/i,
            /^\/@([^\/]+)/i,
        ];
        for (const pattern of patterns) {
            const match = clean.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    var isAuthenticated = document.body.dataset.authenticated === 'true';

    let params = new URLSearchParams(window.location.search);
    let rawAffId = params.get('aff_id');
    let creatorPath = window.location.pathname;

    if (rawAffId == null) {
        var returnUrl = params.get('ReturnUrl');
        if (returnUrl) {
            var qIdx = returnUrl.indexOf('?');
            if (qIdx !== -1) {
                var innerParams = new URLSearchParams(returnUrl.substring(qIdx));
                rawAffId = innerParams.get('aff_id');
                if (rawAffId != null) {
                    params = innerParams;
                    creatorPath = returnUrl.substring(0, qIdx);
                }
            }
        }
    }

    if (rawAffId != null) {
        const affId = rawAffId.trim();
        if (affId.length > 0) {
            const rawAffTp = params.get('aff_tp');
            const affTp = rawAffTp != null && rawAffTp.trim().length > 0
                ? rawAffTp.trim().toLowerCase()
                : null;
            const affC = extractCreatorFromPath(creatorPath);
            writeCookie(affId, affTp, affC, isAuthenticated ? COOKIE_MAX_AGE : COOKIE_MAX_AGE_UNAUTH, isAuthenticated);
            clearAffiliateParams();
        }
    }

    if (isAuthenticated) {
        var data = readCookie();
        if (data && data.aff_id && !data.upgraded) {
            writeCookie(data.aff_id, data.aff_tp, data.aff_c, COOKIE_MAX_AGE, true);
        }
    }

    document.addEventListener(PAYMENT_EVENT_CONTENT_PAID, function (e) {
        var creatorProfileName = e?.detail?.creatorProfileName?.trim();

        if (!creatorProfileName) return;

        var data = readCookie();

        if (data?.aff_c?.trim().toLowerCase() === creatorProfileName.toLowerCase()) {
            deleteCookie();
        }
    });

    window.PrivacyAffiliate = {
        getData: function () {
            return readCookie();
        }
    };
})();
