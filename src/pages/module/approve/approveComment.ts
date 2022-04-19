/**
 *
 * @author 蒋锋 jfok1972@qq.com
 *
 */

// 最多保留多少条审批意见的文字
const MAX_COMMENTS = 20;
const APPROVE_COMMENTS = 'approve_comments';
const SEPARATOR = '|||';

/**
 * 把当前的审批意见加入到localstorate当中
 * @param comment
 */
export const addApproveComments = (comment: string) => {
  if (!comment) return;
  const str = localStorage.getItem(APPROVE_COMMENTS);
  const array = str ? str.split(SEPARATOR) : [];
  const index = array.findIndex((astr) => astr === comment);
  if (index === -1 || index !== 0) {
    if (index === -1) array.splice(0, 0, comment);
    else if (index !== 0) array.splice(0, 0, ...array.splice(index, 1));
    localStorage.setItem(
      APPROVE_COMMENTS,
      array.filter((_, i) => i < MAX_COMMENTS).join(SEPARATOR),
    );
  }
};

/**
 * 获取当前用户的审批意见
 * @returns
 */
export const getApproveComments = () => {
  const str = localStorage.getItem(APPROVE_COMMENTS);
  const array = str ? str.split(SEPARATOR) : [];
  return array.map((value) => ({
    value,
  }));
};
