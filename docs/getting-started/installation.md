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
