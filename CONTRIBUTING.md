# Contributing Guide • AR Portal

Thank you for your interest in contributing to the **AR Portal** on-device augmented reality project!

---

## 🛠️ Development Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/ommd3076/fluffy-couscous.git
   cd fluffy-couscous
   npm install
   ```

2. **Start Local Development Server**:
   ```bash
   npm run dev
   # Server listens at http://localhost:3000
   ```

3. **Running Checks Before Submitting Changes**:
   ```bash
   npm test        # Run Vitest test suites
   npm run lint    # Run TypeScript compiler verification
   npm run build   # Verify Vite production bundle compilation
   ```

---

## 📐 Code Guidelines

- **Zero Camera Video Egress**: Under no circumstances should webcam frames or biometric landmarks be transmitted over the network or saved to persistent storage.
- **Conventional Commits**: Format commit messages as `feat(...)`, `fix(...)`, `docs(...)`, `ci(...)`, `test(...)`, or `chore(...)`.
- **UI & Motion Polish**: Follow the guidelines established in `.agents/skills/` (`better-ui`, `frontend-design`, `interaction-design`).
- **MediaPipe Safety**: Always clamp timestamps passed to `detectForVideo()` monotonically and guard stream disposal.
