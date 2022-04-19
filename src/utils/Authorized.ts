import RenderAuthorize from '@/components/Authorized';
import { currentUser } from 'umi';
import { getAuthority } from './authority';
let Authorized = RenderAuthorize(getAuthority());

// Reload the rights component
const reloadAuthorized = (): void => {
  Authorized = RenderAuthorize(getAuthority());
};

/**
 * hard code
 * block need it。
 */
window.reloadAuthorized = reloadAuthorized;

export { reloadAuthorized };
export default Authorized;

export const isAdmin = () => {
  return currentUser.usercode === 'admin';
};

/**
 * 判断是否是系统管理员或具有系统管理员的权限
 * @returns
 */
export const isAdministrator = () => {
  return currentUser.usercode === 'administrator' || currentUser.roleCodes!.includes('00');
};
