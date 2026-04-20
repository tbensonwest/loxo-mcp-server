# Installation & Setup

## Install the server

Choose whichever method suits your setup.

### Option 0: Smithery (easiest)

Install automatically for Claude Desktop via [Smithery](https://smithery.ai/server/loxo-mcp-server):

```bash
npx -y @smithery/cli install loxo-mcp-server --client claude
```

This handles configuration for you — skip ahead to [Running the server](#running-the-server).

### Option 1: Local install

```bash
# Clone the repository
git clone https://github.com/tbensonwest/loxo-mcp-server.git
cd loxo-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Option 2: Docker install

```bash
# Clone the repository
git clone https://github.com/tbensonwest/loxo-mcp-server.git
cd loxo-mcp-server

# Build the Docker image
docker build -t loxo-mcp-server .

# Or use Docker Compose
docker-compose build
```

## Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your values:

```env
LOXO_API_KEY=your_api_key
LOXO_DOMAIN=app.loxo.co
LOXO_AGENCY_SLUG=your_agency_slug
```

### Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOXO_API_KEY` | Yes | — | Your Loxo API key |
| `LOXO_AGENCY_SLUG` | Yes | — | Your agency's slug in Loxo |
| `LOXO_DOMAIN` | No | `app.loxo.co` | Loxo API domain |
| `LOXO_DEFAULT_OWNER_ID` | No | — | Default Loxo user ID to assign as record owner on candidates created or updated via this server. Overridden per-call by the `owned_by_id` arg. |
| `LOXO_DEFAULT_OWNER_EMAIL` | No | — | Default email for deal ownership. Used by `loxo_create_deal` when no `owner_email` arg is provided. Find emails via `loxo_list_users`. |

### `LOXO_DEFAULT_OWNER_ID` (optional)

A numeric Loxo user ID (stored as a string). When set, every candidate created or updated via `loxo_create_candidate` or `loxo_update_candidate` is assigned this user as `owned_by_id` — unless the call explicitly passes its own `owned_by_id` override.

**How to find your user ID:** ask Claude to run `loxo_list_users` and look up your name in the results.

**If not set:** candidates are created without an owner, which is the existing behaviour.

### `LOXO_DEFAULT_OWNER_EMAIL` (optional)

The email address of the default deal owner. When set, `loxo_create_deal` uses this email to assign ownership unless the call explicitly passes an `owner_email` arg.

**How to find your email:** ask Claude to run `loxo_list_users` and look up your name in the results.

**If not set:** deals are created without a default owner email; you must pass `owner_email` on each `loxo_create_deal` call if ownership is required.

## Claude Desktop configuration

Add the server to your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Local installation

```json
{
  "mcpServers": {
    "loxo": {
      "command": "node",
      "args": ["/path/to/loxo-mcp-server/build/index.js"],
      "env": {
        "LOXO_API_KEY": "your_api_key",
        "LOXO_AGENCY_SLUG": "your_agency_slug",
        "LOXO_DOMAIN": "app.loxo.co"
      }
    }
  }
}
```

Replace `/path/to/loxo-mcp-server` with the actual path where you cloned the repository.

### Docker installation

```json
{
  "mcpServers": {
    "loxo": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "LOXO_API_KEY=your_api_key",
        "-e", "LOXO_AGENCY_SLUG=your_agency_slug",
        "-e", "LOXO_DOMAIN=app.loxo.co",
        "loxo-mcp-server"
      ]
    }
  }
}
```

::: tip
The `-i` flag is required because MCP servers communicate over stdin/stdout.
:::

## Running the server

### Local

```bash
npm start
```

### Docker Compose

```bash
# Ensure your .env file is configured, then:
docker-compose up

# Or run in the background:
docker-compose up -d
```

### Docker (direct)

```bash
docker run -i \
  -e LOXO_API_KEY=your_api_key \
  -e LOXO_AGENCY_SLUG=your_agency_slug \
  -e LOXO_DOMAIN=app.loxo.co \
  loxo-mcp-server
```
