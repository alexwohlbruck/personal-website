# Personal website

## Requirements
- [Node.js](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/en/docs/install)

## Project setup
### Install dependencies
```bash
cd server
yarn install
cd ../client
yarn install
```

### Set up environment
#### `server/.env`
| Name                  | Type   | Recommended value         |  Description |
|-----------------------|--------|---------------------------|-----------------------------------------------|
| PORT                  | number | 3000                      | Port to run the server on                     |
| GOOGLE_API_KEY        | string |                           | API key from Google Developers Console        |
| GOOGLE_CALENDAR_ID    | string | Your gmail                | Your calendar ID, usually your gmail address  |
| IG_ACCESS_TOKEN       | string |                           | Access token from Instagram Developer Console |
| IG_APP_ID             | string |                           | App ID from Instagram Developer Console       |
| IG_APP_SECRET         | string |                           | App secret from Instagram Developer Console   |
| IG_REDIRECT_URI       | string | {backendUrl}/callback     | Redirect URI from Instagram Developer Console |
| MAIL_HOST             | string | smtp.gmail.com            | Mail server host                              |
| MAIL_PASS             | string |                           | Mail server password                          |
| MAIL_PORT             | string | 465                       | Mail server port                              |
| MAIL_USER             | string | Your gmail                | Mail server email                             |
| SPOTIFY_CLIENT_ID     | string |                           | Client ID from Spotify Developer Console      |
| SPOTIFY_CLIENT_SECRET | string |                           | Client secret from Spotify Developer Console  |
| SPOTIFY_REDIRECT_URI  | string | {localhost:8080}/callback | Redirect URI from Spotify Developer Console   |
| SPOTIFY_REFRESH_TOKEN | string |                           | Refresh token from Spotify Developer Console  |

#### `client/.env`
| Name                | Type   | Recommended value |  Description              |
|---------------------|--------|-------------------|---------------------------|
| VUE_APP_BACKEND_URL | string | {backendUrl}      | URL to the backend server |

## Running for development
### Start the server
```bash
cd server
yarn start
```

### Start the frontend
In a new terminal:
```bash
cd client
yarn serve
```

## Building for production
### Frontend compiles and minifies for production
```bash
cd client
yarn build
```
