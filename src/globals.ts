const subject = 'Contacting you from your website'

export const contact = {
  name: 'Alex Wohlbruck',
  email: 'alexwohlbruck@gmail.com',
  mailto: function(body?: string) {
    return `mailto:${this.email}?subject=${subject}&body=${body || ''}`
  },
  linkedin: 'https://linkedin.com/in/alexwohlbruck',
  github: 'https://github.com/alexwohlbruck',
  instagram: 'https://instagram.com/alexwohlbruck',
  spotify: 'https://open.spotify.com/user/alexwohlbruck',
}
