# Addon Example for Streamio
ᏖᏂᏋ ᎶᏋᏋᏦ
## Overview
This is a simple addon for Streamio that provides streaming content. It's built as a Node.js application using Express and serves TV channel streams.

## Features
- Provides TV streaming content
- RESTful API endpoints
- Serves static content from public directory
- Compliant with Streamio addon specifications

## Prerequisites
- Node.js (latest LTS version recommended)
- npm or yarn package manager

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd addon-example

# Install dependencies
npm install
```

## Configuration
The addon is configured through the `manifest.json` file, which contains metadata about the addon such as:
- ID: `org.addon-example`
- Name: "Addon example"
- Supported resources: streams
- Supported content types: TV, MOVIE, 

You can modify this file to customize your addon's appearance and behavior in Streamio.

## Usage

```bash
# Start the server
npm start
```

The server will start on port 3000. You can access the following endpoints:

- `GET /`: Returns a status message
- `GET /manifest.json`: Returns the addon manifest
- `GET /stream/tv`: Returns available TV streams

## Development

The project structure is organized as follows:

```
/
├── public/            # Static files
├── src/
│   ├── handlers/      # Request handlers
│   │   └── streamHandler.js
│   └── index.js       # Main application entry point
├── manifest.json      # Addon manifest
└── package.json       # Project dependencies and scripts
```

To add more stream types or modify existing ones, edit the `streamHandler.js` file.

## License
ISC

## Author
Your Name

---

This addon example demonstrates how to create a basic Streamio addon. For more information about Streamio addons, please refer to the official documentation.
