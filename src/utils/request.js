/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import {extend} from 'umi-request';
import {notification} from 'antd';
import router from 'umi/router';
import Qs from 'qs';
import {getAccessToken} from '@/utils/token';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 异常处理程序
 */
const errorHandler = error => {

  console.log(error)

  const {response = {}} = error;
  const errortext = codeMessage[response.status] || response.statusText;
  const {status, url} = response;

  if (status === 401) {
    notification.error({
      message: '未登录或登录已过期，请重新登录。',
    });
    // @HACK
    /* eslint-disable no-underscore-dangle */
    window.g_app._store.dispatch({
      type: 'login/logout',
    });
    return;
  }
  notification.error({
    message: `请求错误 ${status}: ${url}`,
    description: errortext,
  });
  // environment should not be used
  if (status === 403) {
    router.push('/exception/403');
    return;
  }
  if (status <= 504 && status >= 500) {
    router.push('/exception/500');
    return;
  }
  if (status >= 404 && status < 422) {
    router.push('/exception/404');
  }
};

/**
 * 配置request请求时的默认参数
 */
const request = extend({
  prefix: '/api',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'Authorization': `Bearer ${getAccessToken()}`
  },
  timeout: 10000,
  // 默认错误处理
  errorHandler,
  // 默认请求是否带上cookie
  // credentials: 'include',
});

// request拦截器
request.interceptors.request.use(async (url, options) => {

  options.headers.Authorization = `Bearer ${getAccessToken()}`;

  console.log(options.headers.Authorization);
  return {url, options};
});

export const requestForm = (interfaceName, method = "POST", params = {}) =>
  request(interfaceName, {
    method,
    data: Qs.stringify(params),
    getResponse: true
  }).then(value => {
    if (value.data.code !== 0) {
      const error = new Error(value.data.msg);
      error.response = value.response;
      throw error
    } else {
      console.log(value.data);
      return value.data;
    }
  }).catch(reason => {
    notification.error({
      message: reason.message,
    });
  });

export default request;