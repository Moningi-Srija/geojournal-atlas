const fs = require('fs');
const authContextPath = 'src/components/AuthContext.tsx';
let content = fs.readFileSync(authContextPath, 'utf8');

// Mock useAuth to return a fake user
const mockUseAuth = `
export function useAuth() {
  return {
    user: { uid: 'test-user-id', email: 'test@test.com' },
    profile: { username: 'test_explorer', displayName: 'Explorer', photoURL: '' },
    loading: false,
    logout: async () => {}
  };
}
`;

content = content.replace(/export function useAuth\(\) \{[\s\S]*?^}/m, mockUseAuth);
fs.writeFileSync(authContextPath, content);
