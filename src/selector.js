/* global ROMANO_BUNDLES */

import uaParser from 'ua-parser-js'

const bundles = ROMANO_BUNDLES

export function getBundle (userAgent) {
  for (let i = 0; i < bundles.length; i++) {
    const bundle = bundles[i]

    if (bundle.browsers.filter(matchesUA(uaParser(userAgent))).length > 0) {
      return ROMANO_BUNDLE_FILENAME.replace('[name]', bundle.name)
    }
  }
  return ROMANO_BUNDLE_FILENAME.replace('[name]', 'fallback')
}

function matchesUA (agent) {
  const agentVersion = parseVersion(agent.browser.version)
  const agentName = getBrowserName(agent).toLowerCase()

  return (browser) => {
    const res = /(\w+) (all|[\d.]+)(?:-([\d.]+))?/.exec(browser)
    const browserName = res[1]
    const minVersion = res[2] === 'all' ? { major: 0, minor: 0, patch: 0 } : parseVersion(res[2])
    const maxVersion = res[2] === 'all' ? { major: Infinity, minor: Infinity, patch: Infinity } : parseVersion(res[3] || res[2], Infinity)

    return browserName === agentName &&
      agentVersion.major >= minVersion.major &&
      agentVersion.minor >= minVersion.minor &&
      agentVersion.patch >= minVersion.patch &&
      agentVersion.major <= maxVersion.major &&
      agentVersion.minor <= maxVersion.minor &&
      agentVersion.patch <= maxVersion.patch
  }
}

function parseVersion (versionString, defaultSegment = 0) {
  const segments = versionString.split('.')
  return {
    major: segments[0] ? Number(segments[0]): defaultSegment,
    minor: segments[1] ? Number(segments[1]): defaultSegment,
    patch: segments[2] ? Number(segments[2]): defaultSegment,
  }
}

function getBrowserName(agent) {
  if (agent.browser.name === 'Android Browser') {
    return 'android'
  } else if (agent.os.name === 'BlackBerry') {
    return 'bb'
  } else if (agent.browser.name === 'Chrome' && agent.os.name === 'Android') {
    return 'and_chr'
  } else if (agent.browser.name === 'Firefox' && agent.os.name === 'Android') {
    return 'and_ff'
  } else if (agent.browser.name === 'IEMobile') {
    return 'ie_mob'
  } else if (agent.browser.name === 'Opera Mobi') {
    return 'op_mob'
  } else if (agent.browser.name === 'Safari' && agent.os.name === 'iOS') {
    return 'ios_saf'
  } else if (agent.browser.name === 'UCBrowser') {
    return 'and_uc'
  }
  return agent.browser.name
}
