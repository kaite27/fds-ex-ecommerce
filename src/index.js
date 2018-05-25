import axios from 'axios';

// token instance 활용하기 -> axio. 선언하는 것 모두 postAPI 로 변경!
const postAPI = axios.create({
  baseURL: process.env.API_URL
  // baseURL: 'http://localhost:3000'
})

const rootEl = document.querySelector('.root')

function login(token) {
  localStorage.setItem('token', token)
  // postAPI.defaults : 항상 기본으로 동작
  postAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
  // BEM -- modifier
  rootEl.classList.add('root--authed')
}

function logout() {
  localStorage.removeItem('token')
  // 객체의 속성을 지울 때는 delete
  delete postAPI.defaults.headers['Authorization']
  rootEl.classList.remove('root--authed')
}