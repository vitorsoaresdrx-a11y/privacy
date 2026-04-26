const SESSION_STORAGE_PREFIX = "privacy"

const MAPPED_CHANNELS = {
    board: "BOARD",
    chat: "CHAT",
    search: "SEARCH",
    fixedFriendships: "PROFILE_FRIENDSHIPS",
    mencoes: "TIMELINE_MENTION",
    expired: "TIMELINE_EXPIRED",
    suggestions: "TIMELINE_TOP_CREATORS",
    lastSeen: "TIMELINE_LAST_SEEN",
    promotion: "TIMELINE_PROMOTIONS",
    topCreatorsPromotions: "TOP_CREATORS_PROMOTIONS",
    topCreatorsOverall: "TOP_CREATORS_OVERALL",
    topCreatorsSubscription: "TOP_CREATORS_SUBSCRIPTION",
    topCreatorsPost: "TOP_CREATORS_POST",
    topCreatorsChat: "TOP_CREATORS_CHAT",
    topCreatorsMeeting: "TOP_CREATORS_MEETING",
    topCreatorsLive: "TOP_CREATORS_LIVE",
    topCreatorsTip: "TOP_CREATORS_TIP",
    checkout: "CHECKOUT",
    profile: "PROFILE",
    "/": "FEED",
    lp: "LP_BOARD",
    topCreatorsFree: "TOP_CREATORS_FREE",
    follow: "FOLLOW",
    post: "POST",
    colecoes: "COLLECTIONS",
    adsSearch: "ADS_SEARCH",
    adsFollow: "ADS_FOLLOW",
    topSharePost: "TOPSHARE_POST",
    affiliateLinkEarn: "AFFILIATE_LINKEARN",
}

const AFFILIATE_CHANNELS = {
    linkearn: "affiliateLinkEarn",
}

const STORAGE_KEYS = {
    current: `${SESSION_STORAGE_PREFIX}__current-route`,
    last: `${SESSION_STORAGE_PREFIX}__last-route`,
    penultimate: `${SESSION_STORAGE_PREFIX}__penultimate-route`,
    element: `${SESSION_STORAGE_PREFIX}__clicked-element`,
    elementRoute: `${SESSION_STORAGE_PREFIX}__clicked-element-route`
}

const USER_INFO_SELECTOR = "privacy-web-user-info"

const SOURCE_ATTRIBUTE_NAME = "source"
const SOURCE_ID_ATTRIBUTE_NAME = "source-id"

const FLOAT_MENU_EVENT = "float-menu-event__clicked"
const PAYMENT_EVENT = "payment-event__opened"
const PROFILE_CARD_EVENT = "profile-card-event__clicked"
const RANKING_EVENT = "ranking-event__clicked"
const CHAT_EVENT = "chat-event__room-changed"
const USER_INFO_EVENTS = {
    loaded: "user-info-event__loaded",
}
const BOARD_EVENT = "board-event__clicked"
const TIMELINE_EVENT = "timeline-event__post-description-clicked"

let clickedElement = null

const read = (key) => sessionStorage.getItem(key) || null
const write = (key, value) => sessionStorage.setItem(key, isObject(value) ? JSON.stringify(value) : value)
const remove = (key) => sessionStorage.removeItem(key)
const has = (value) => typeof value === "string" && value.length > 0 || isObject(value)

const tryJsonParse = (value) => {
    if (typeof value !== "string") return value
    try { return JSON.parse(value) } catch { return value }
}

const getMappedChannel = (raw) => {
    if (!has(raw)) return null
    if (raw === "/") return MAPPED_CHANNELS["/"]

    const clean = raw.split("?")[0].replace(/^\//, "").trim()
    const [base] = clean.split("/")

    if (Object.prototype.hasOwnProperty.call(MAPPED_CHANNELS, base)) {
        return MAPPED_CHANNELS[base]
    }

    const foundKey = Object.keys(MAPPED_CHANNELS).find((key) => key.toLowerCase() === base.toLowerCase())

    return foundKey ? MAPPED_CHANNELS[foundKey] : null
}

const clearStorage = ({ preserveCurrent = false } = {}) => {
    for (const key of Object.values(STORAGE_KEYS)) {
        if (preserveCurrent && key === STORAGE_KEYS.current) continue
        remove(key)
    }
}

const getProfileNameFromPath = (path) => {
    if (!has(path)) return null

    const clean = path.replace(/\?.*$/, "").replace(/\/$/, "")
    const match = clean.match(/^\/profile\/([^\/]+)/)
    return match ? match[1] : null
}

const normalizePath = (path) => {
    if (!has(path)) return null
    if (path === "/") return "/"

    const clean = path.split("?")[0].replace(/\/$/, "").toLowerCase()

    const match = clean.match(/^\/profile\/([^\/]+)/)
    if (match) return `/profile/${match[1]}`

    return clean
}

const isObject = (value) => {
    return value !== null && typeof value === "object" && !Array.isArray(value)
}

const isNewSession = () => {
    return document.referrer === ""
}

const init = () => {
    if (isNewSession()) {
        clearStorage({ preserveCurrent: false })
    }
    initRoutes()
    checkClickedElement()
    checkLastRoute()
}

const checkClickedElement = () => {
    const storedElement = read(STORAGE_KEYS.element)
    const storedElementRoute = normalizePath(read(STORAGE_KEYS.elementRoute))
    const lastRoute = normalizePath(read(STORAGE_KEYS.last))

    if (has(storedElement) && has(storedElementRoute)) {
        const penultimate = read(STORAGE_KEYS.penultimate)
        const last = read(STORAGE_KEYS.last)
        const current = read(STORAGE_KEYS.current)

        const penultimateMapped = getMappedChannel(penultimate)
        const lastMapped = getMappedChannel(last)
        const currentMapped = getMappedChannel(current)

        const isValid = lastRoute === storedElementRoute || isBoardFlowDisconnected(penultimateMapped, lastMapped, currentMapped) || isLpFlowDisconnected(penultimateMapped, lastMapped, currentMapped)

        if (isValid) {
            clickedElement = storedElement
        } else {
            remove(STORAGE_KEYS.element)
            remove(STORAGE_KEYS.elementRoute)
        }
    }
}

const initRoutes = () => {
    const rawCurrent = location.pathname
    const normalizedCurrent = normalizePath(rawCurrent)

    const rawPrevCurrent = read(STORAGE_KEYS.current)
    const normalizedPrevCurrent = normalizePath(rawPrevCurrent)

    const rawPrevLast = read(STORAGE_KEYS.last)

    if (has(rawPrevCurrent) && normalizedPrevCurrent !== normalizedCurrent) {
        if (has(rawPrevLast)) {
            write(STORAGE_KEYS.penultimate, rawPrevLast)
        }

        write(STORAGE_KEYS.last, rawPrevCurrent)
    }

    write(STORAGE_KEYS.current, rawCurrent)
}

const checkLastRoute = () => {
    const last = read(STORAGE_KEYS.last)

    if (has(last) && last?.includes("/auth")) {
        clearStorage({ preserveCurrent: true })
    }
}

const isBoardFlowDisconnected = (penultimate, last, current) => {
    return penultimate === MAPPED_CHANNELS.board && last === MAPPED_CHANNELS.checkout && current === MAPPED_CHANNELS.profile
}

const isLpFlowDisconnected = (penultimate, last, current) => {
    return penultimate === MAPPED_CHANNELS.lp && last === MAPPED_CHANNELS.checkout && current === MAPPED_CHANNELS.profile
}

const isAgeVerificationFlow = (rawLast, rawPenultimate, currentMapped) => {
    return rawLast?.includes("/age-verification-callback")
        && rawPenultimate?.includes("/age-verification")
        && (currentMapped === MAPPED_CHANNELS.profile || currentMapped === MAPPED_CHANNELS.checkout)
}

const resolveAffiliateSource = () => {
    const affData = window.PrivacyAffiliate?.getData()
    if (!affData || !affData.aff_tp) return null

    const channelKey = AFFILIATE_CHANNELS[affData.aff_tp]
    if (!channelKey) return null

    const last = read(STORAGE_KEYS.last)
    if (!has(last)) {
        return { source: MAPPED_CHANNELS[channelKey], sourceId: affData.aff_id || null }
    }

    const lastMapped = getMappedChannel(last)
    if (lastMapped === MAPPED_CHANNELS.checkout || lastMapped === MAPPED_CHANNELS.profile) {
        return { source: MAPPED_CHANNELS[channelKey], sourceId: affData.aff_id || null }
    }

    const penultimate = read(STORAGE_KEYS.penultimate)
    const currentMapped = getMappedChannel(read(STORAGE_KEYS.current))

    if (isAgeVerificationFlow(last, penultimate, currentMapped)) {
        return { source: MAPPED_CHANNELS[channelKey], sourceId: affData.aff_id || null }
    }

    return null
}

const resolveMappedSource = (clickedElement, roomChanged) => {
    const penultimate = read(STORAGE_KEYS.penultimate)
    const last = read(STORAGE_KEYS.last)
    const current = read(STORAGE_KEYS.current)

    const parsedElement = tryJsonParse(clickedElement)

    if (isObject(parsedElement)) {
        source = parsedElement?.source
    } else {
        source = (has(clickedElement) && clickedElement) || (has(last) && last) || (has(current) && current)
    }

    let mapped = getMappedChannel(source)
    let sourceId = null

    const penultimateMapped = getMappedChannel(penultimate)
    const lastMapped = getMappedChannel(last)
    const currentMapped = getMappedChannel(current)

    // Mural corner case
    if (isBoardFlowDisconnected(penultimateMapped, lastMapped, currentMapped)) {
        mapped = "BOARD"
    }

    // Chat corner case
    if (roomChanged) {
        mapped = "CHAT"
    }

    // LP corner case
    if (isLpFlowDisconnected(penultimateMapped, lastMapped, currentMapped)) {
        mapped = "LP_BOARD"
    }

    const affiliateResult = resolveAffiliateSource()
    if (affiliateResult) {
        mapped = affiliateResult.source
        sourceId = affiliateResult.sourceId
    }

    if (!sourceId && canTrackPost(mapped) && isObject(parsedElement)) {
        sourceId = parsedElement?.referenceId || null
    }

    if (!has(mapped)) return null

    return { source: mapped, sourceId }
}

document.addEventListener("DOMContentLoaded", init)

document.addEventListener(FLOAT_MENU_EVENT, () => {
    clearStorage()
})

document.addEventListener("popstate", () => {
    initRoutes()
})

function handleElementStorage(detail) {
    if (has(detail)) {
        write(STORAGE_KEYS.element, detail)
        write(STORAGE_KEYS.elementRoute, normalizePath(location.pathname))
    }
}

[PROFILE_CARD_EVENT, RANKING_EVENT, BOARD_EVENT, TIMELINE_EVENT].forEach(eventName => {
    document.addEventListener(eventName, (e) => handleElementStorage(e?.detail))
})

let profileName = null
let roomChanged = false

document.addEventListener(CHAT_EVENT, (event) => {
    profileName = event?.detail?.profileName

    const last = read(STORAGE_KEYS.last)
    const current = read(STORAGE_KEYS.current)

    const lastMapped = getMappedChannel(last)
    const currentMapped = getMappedChannel(current)
    const lastProfileName = getProfileNameFromPath(last)

    const isProfileToChatFlow = lastMapped === "PROFILE" && currentMapped === "CHAT"

    if (isProfileToChatFlow && lastProfileName !== profileName) {
        roomChanged = true
    }
})

document.addEventListener(PAYMENT_EVENT, (event) => {
    const visible = !!event?.detail?.visible
    const paymentEl = event?.detail?.element

    if (!paymentEl) return

    if (visible) {
        const parsedElement = tryJsonParse(clickedElement)
        const result = resolveMappedSource(parsedElement, roomChanged)

        if (result) {
            paymentEl.setAttribute(SOURCE_ATTRIBUTE_NAME, result.source)

            if (result.sourceId) {
                paymentEl.setAttribute(SOURCE_ID_ATTRIBUTE_NAME, result.sourceId)
            }
        }
    } else {
        paymentEl.removeAttribute(SOURCE_ATTRIBUTE_NAME)
        paymentEl.removeAttribute(SOURCE_ID_ATTRIBUTE_NAME)
    }
})

document.addEventListener(USER_INFO_EVENTS.loaded, () => {
    const userInfoEl = document.querySelector(USER_INFO_SELECTOR)
    if (!userInfoEl) return

    const result = resolveMappedSource(clickedElement, roomChanged)
    if (result) {
        userInfoEl.setAttribute(SOURCE_ATTRIBUTE_NAME, result.source)

        if (result.sourceId) {
            userInfoEl.setAttribute(SOURCE_ID_ATTRIBUTE_NAME, result.sourceId)
        }
    }
})

const canTrackPost = (mapped) => {
    return mapped === MAPPED_CHANNELS.board || mapped === MAPPED_CHANNELS.lp || mapped === MAPPED_CHANNELS.topSharePost
}