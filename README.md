# Stable Diffusion Desktop

A cross-platform desktop application for interfacing with Stable Diffusion APIs, providing an intuitive user interface for AI image generation with comprehensive prompt and image management.

## 🎯 Project Goals

**Primary Objective**: Create a user-friendly desktop application that simplifies the process of generating AI images using Stable Diffusion models while maintaining a complete history of prompts and generated content.

**Key Goals**:

- **Intuitive Image Generation**: Provide a clean, accessible interface for entering prompts and configuring generation parameters
- **Comprehensive Tracking**: Maintain detailed records linking generated images to their corresponding prompts and settings
- **Cross-Platform Compatibility**: Ensure seamless operation across Windows, macOS, and Linux
- **Local Data Management**: Store user data and preferences locally for privacy and offline access
- **Performance Optimization**: Deliver a responsive experience for both UI interactions and API communications

## 🚀 Features

### Current Features

- ✅ Cross-platform Electron application framework
- ✅ Modern TypeScript development environment
- ✅ Responsive SolidJS-based user interface

### Planned Features

- 🔄 **API Integration**

  - Support for multiple Stable Diffusion API providers
  - Configurable API endpoints and authentication
  - Real-time generation status monitoring

- 🔄 **Prompt Management**

  - Advanced prompt editor with syntax highlighting
  - Prompt templates and presets
  - Prompt history and favorites
  - Batch prompt processing

- 🔄 **Image Generation Controls**

  - Comprehensive parameter configuration (steps, guidance scale, seed, etc.)
  - Multiple sampling methods support
  - Resolution and aspect ratio presets
  - Negative prompt support

- 🔄 **Gallery & Organization**

  - Grid-based image gallery with metadata
  - Image-to-prompt association tracking
  - Search and filter functionality
  - Export capabilities (individual images or batches)
  - Collections and tagging system

- 🔄 **Advanced Features**
  - Image-to-image generation
  - Inpainting and outpainting support
  - ControlNet integration
  - Model switching and management

## 🛠 Tech Stack

- **Framework**: Electron
- **Frontend**: SolidJS
- **Language**: TypeScript

## 📁 Application Structure

### Codebase Structure

```
stable-diffusion-desktop/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main application logic
│   │   └── project-manager.ts # Project management
│   ├── preload/        # Preload scripts for secure IPC
│   │   └── index.ts    # IPC bridge
│   ├── renderer/       # Frontend application
│   │   ├── index.html  # Entry HTML file
│   │   └── src/        # SolidJS components
│   │       ├── app.tsx
│   │       ├── project-selector.tsx
│   │       └── main.tsx
│   └── db/             # Database schema and migrations
│       ├── schema.ts   # Drizzle ORM schema
│       └── migrate.ts  # Database migration logic
├── build/              # Build resources (icons, etc.)
└── out/                # Built application output
```

### Project Data Structure

Each project is a **self-contained directory** with the following structure:

```
ProjectName/                    # User-chosen project directory
├── project.db                 # SQLite database containing:
│                              #   - Project metadata
│                              #   - Generation history
│                              #   - Prompt/parameter records
└── images/                    # Generated images directory
    ├── generated_image_1.png
    ├── generated_image_2.jpg
    └── ...
```

**Key Features of Project Structure:**

- **Self-contained**: Each project folder contains everything related to that project
- **Portable**: Projects can be moved, copied, or backed up as single folders
- **User-controlled**: Projects can be stored anywhere on the user's system
- **Database-tracked**: All generation metadata is stored in the local SQLite database
- **Recent Projects**: App remembers the last 10 opened projects for quick access

**Project Management:**

- **Simple Project Creation**: Click "Create New Project" and select/create the folder that will BE your project
- **Direct Folder Selection**: No separate naming step - the folder name becomes the project name
- **Open Existing Projects**: Select any existing project folder to open it
- **Recent Projects Tracking**: Last 10 opened projects are automatically remembered and displayed
- **Complete Self-Containment**: Each project folder contains everything related to that project

## 🏗 Development Roadmap

### Phase 1: Core Infrastructure

- [x] Project setup and configuration
- [x] Basic Electron application structure
- [x] Project management system with SQLite/Drizzle
- [x] Recent projects tracking
- [x] Self-contained project structure
- [ ] API integration framework
- [ ] Basic UI components

### Phase 2: Essential Features

- [ ] Prompt input and configuration UI
- [ ] Image generation workflow
- [ ] Basic gallery implementation
- [ ] Local data storage

### Phase 3: Advanced Features

- [ ] Advanced prompt management
- [ ] Enhanced gallery with search/filter
- [ ] Batch processing capabilities
- [ ] Settings and preferences

### Phase 4: Polish & Enhancement

- [ ] Performance optimizations
- [ ] Advanced AI features (ControlNet, etc.)
- [ ] Plugin/extension system
- [ ] Comprehensive testing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

- Follow TypeScript best practices
- Maintain consistent code formatting
- Write descriptive commit messages
- Test your changes thoroughly across platforms

## 🔗 Related Links

- [Stable Diffusion](https://stability.ai/stable-diffusion)
- [Electron Documentation](https://www.electronjs.org/docs)
- [SolidJS Documentation](https://www.solidjs.com/docs)

---

**Note**: This application is currently in early development. Features and functionality are being actively implemented and may change.
