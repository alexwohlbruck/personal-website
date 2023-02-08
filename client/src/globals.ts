export const BACKEND_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.VUE_APP_BACKEND_URL
    : 'http://localhost:3000'
export const MOBILE_BREAKPOINT = 900

export const contact = {
  name: 'Alex Wohlbruck',
  linkedin: 'https://linkedin.com/in/alexwohlbruck',
  github: 'https://github.com/alexwohlbruck',
  instagram: 'https://instagram.com/alexwohlbruck',
  spotify: 'https://open.spotify.com/user/alexwohlbruck',
  musescore: 'https://musescore.com/user/29055565',
  twitter: 'https://twitter.com/alexwohlbruck',
}
