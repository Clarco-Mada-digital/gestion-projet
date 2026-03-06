import{r as k,_ as T,C as y,a as P,E as te,o as R,F as Ne,g as F,b as _e,v as Oe,i as De,c as Me,d as E,e as ne,f as Pe,h as Re}from"./dateUtils.CLtdeGqO.js";import"./index.DgOxCJIz.js";const oe="@firebase/installations",$="0.6.20";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ie=1e4,re=`w:${$}`,se="FIS_v2",Fe="https://firebaseinstallations.googleapis.com/v1",$e=3600*1e3,Ke="installations",je="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qe={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},p=new te(Ke,je,qe);function ae(e){return e instanceof Ne&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ce({projectId:e}){return`${Fe}/projects/${e}/installations`}function ue(e){return{token:e.token,requestStatus:2,expiresIn:xe(e.expiresIn),creationTime:Date.now()}}async function de(e,t){const o=(await t.json()).error;return p.create("request-failed",{requestName:e,serverCode:o.code,serverMessage:o.message,serverStatus:o.status})}function fe({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function Le(e,{refreshToken:t}){const n=fe(e);return n.append("Authorization",He(t)),n}async function le(e){const t=await e();return t.status>=500&&t.status<600?e():t}function xe(e){return Number(e.replace("s","000"))}function He(e){return`${se} ${e}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ve({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const o=ce(e),i=fe(e),r=t.getImmediate({optional:!0});if(r){const s=await r.getHeartbeatsHeader();s&&i.append("x-firebase-client",s)}const a={fid:n,authVersion:se,appId:e.appId,sdkVersion:re},u={method:"POST",headers:i,body:JSON.stringify(a)},d=await le(()=>fetch(o,u));if(d.ok){const s=await d.json();return{fid:s.fid||n,registrationStatus:2,refreshToken:s.refreshToken,authToken:ue(s.authToken)}}else throw await de("Create Installation",d)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pe(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Be(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const We=/^[cdef][\w-]{21}$/,M="";function Ue(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=Ge(e);return We.test(n)?n:M}catch{return M}}function Ge(e){return Be(e).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function v(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ge=new Map;function we(e,t){const n=v(e);he(n,t),Je(n,t)}function he(e,t){const n=ge.get(e);if(n)for(const o of n)o(t)}function Je(e,t){const n=ze();n&&n.postMessage({key:e,fid:t}),Ye()}let l=null;function ze(){return!l&&"BroadcastChannel"in self&&(l=new BroadcastChannel("[Firebase] FID Change"),l.onmessage=e=>{he(e.data.key,e.data.fid)}),l}function Ye(){ge.size===0&&l&&(l.close(),l=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xe="firebase-installations-database",Qe=1,g="firebase-installations-store";let C=null;function K(){return C||(C=R(Xe,Qe,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(g)}}})),C}async function I(e,t){const n=v(e),i=(await K()).transaction(g,"readwrite"),r=i.objectStore(g),a=await r.get(n);return await r.put(t,n),await i.done,(!a||a.fid!==t.fid)&&we(e,t.fid),t}async function be(e){const t=v(e),o=(await K()).transaction(g,"readwrite");await o.objectStore(g).delete(t),await o.done}async function A(e,t){const n=v(e),i=(await K()).transaction(g,"readwrite"),r=i.objectStore(g),a=await r.get(n),u=t(a);return u===void 0?await r.delete(n):await r.put(u,n),await i.done,u&&(!a||a.fid!==u.fid)&&we(e,u.fid),u}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function j(e){let t;const n=await A(e.appConfig,o=>{const i=Ze(o),r=et(e,i);return t=r.registrationPromise,r.installationEntry});return n.fid===M?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function Ze(e){const t=e||{fid:Ue(),registrationStatus:0};return me(t)}function et(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(p.create("app-offline"));return{installationEntry:t,registrationPromise:i}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},o=tt(e,n);return{installationEntry:n,registrationPromise:o}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:nt(e)}:{installationEntry:t}}async function tt(e,t){try{const n=await Ve(e,t);return I(e.appConfig,n)}catch(n){throw ae(n)&&n.customData.serverCode===409?await be(e.appConfig):await I(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function nt(e){let t=await W(e.appConfig);for(;t.registrationStatus===1;)await pe(100),t=await W(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:o}=await j(e);return o||n}return t}function W(e){return A(e,t=>{if(!t)throw p.create("installation-not-found");return me(t)})}function me(e){return ot(e)?{fid:e.fid,registrationStatus:0}:e}function ot(e){return e.registrationStatus===1&&e.registrationTime+ie<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function it({appConfig:e,heartbeatServiceProvider:t},n){const o=rt(e,n),i=Le(e,n),r=t.getImmediate({optional:!0});if(r){const s=await r.getHeartbeatsHeader();s&&i.append("x-firebase-client",s)}const a={installation:{sdkVersion:re,appId:e.appId}},u={method:"POST",headers:i,body:JSON.stringify(a)},d=await le(()=>fetch(o,u));if(d.ok){const s=await d.json();return ue(s)}else throw await de("Generate Auth Token",d)}function rt(e,{fid:t}){return`${ce(e)}/${t}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function q(e,t=!1){let n;const o=await A(e.appConfig,r=>{if(!ke(r))throw p.create("not-registered");const a=r.authToken;if(!t&&ct(a))return r;if(a.requestStatus===1)return n=st(e,t),r;{if(!navigator.onLine)throw p.create("app-offline");const u=dt(r);return n=at(e,u),u}});return n?await n:o.authToken}async function st(e,t){let n=await U(e.appConfig);for(;n.authToken.requestStatus===1;)await pe(100),n=await U(e.appConfig);const o=n.authToken;return o.requestStatus===0?q(e,t):o}function U(e){return A(e,t=>{if(!ke(t))throw p.create("not-registered");const n=t.authToken;return ft(n)?{...t,authToken:{requestStatus:0}}:t})}async function at(e,t){try{const n=await it(e,t),o={...t,authToken:n};return await I(e.appConfig,o),n}catch(n){if(ae(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await be(e.appConfig);else{const o={...t,authToken:{requestStatus:0}};await I(e.appConfig,o)}throw n}}function ke(e){return e!==void 0&&e.registrationStatus===2}function ct(e){return e.requestStatus===2&&!ut(e)}function ut(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+$e}function dt(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function ft(e){return e.requestStatus===1&&e.requestTime+ie<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function lt(e){const t=e,{installationEntry:n,registrationPromise:o}=await j(t);return o?o.catch(console.error):q(t).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function pt(e,t=!1){const n=e;return await gt(n),(await q(n,t)).token}async function gt(e){const{registrationPromise:t}=await j(e);t&&await t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wt(e){if(!e||!e.options)throw N("App Configuration");if(!e.name)throw N("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw N(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function N(e){return p.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Te="installations",ht="installations-internal",bt=e=>{const t=e.getProvider("app").getImmediate(),n=wt(t),o=P(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:o,_delete:()=>Promise.resolve()}},mt=e=>{const t=e.getProvider("app").getImmediate(),n=P(t,Te).getImmediate();return{getId:()=>lt(n),getToken:i=>pt(n,i)}};function kt(){T(new y(Te,bt,"PUBLIC")),T(new y(ht,mt,"PRIVATE"))}kt();k(oe,$);k(oe,$,"esm2020");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tt="/firebase-messaging-sw.js",yt="/firebase-cloud-messaging-push-scope",ye="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",It="https://fcmregistrations.googleapis.com/v1",Ie="google.c.a.c_id",St="google.c.a.c_l",vt="google.c.a.ts",At="google.c.a.e",G=1e4;var J;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(J||(J={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var b;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked"})(b||(b={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function f(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Et(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),o=atob(n),i=new Uint8Array(o.length);for(let r=0;r<o.length;++r)i[r]=o.charCodeAt(r);return i}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _="fcm_token_details_db",Ct=5,z="fcm_token_object_Store";async function Nt(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(r=>r.name).includes(_))return null;let t=null;return(await R(_,Ct,{upgrade:async(o,i,r,a)=>{if(i<2||!o.objectStoreNames.contains(z))return;const u=a.objectStore(z),d=await u.index("fcmSenderId").get(e);if(await u.clear(),!!d){if(i===2){const s=d;if(!s.auth||!s.p256dh||!s.endpoint)return;t={token:s.fcmToken,createTime:s.createTime??Date.now(),subscriptionOptions:{auth:s.auth,p256dh:s.p256dh,endpoint:s.endpoint,swScope:s.swScope,vapidKey:typeof s.vapidKey=="string"?s.vapidKey:f(s.vapidKey)}}}else if(i===3){const s=d;t={token:s.fcmToken,createTime:s.createTime,subscriptionOptions:{auth:f(s.auth),p256dh:f(s.p256dh),endpoint:s.endpoint,swScope:s.swScope,vapidKey:f(s.vapidKey)}}}else if(i===4){const s=d;t={token:s.fcmToken,createTime:s.createTime,subscriptionOptions:{auth:f(s.auth),p256dh:f(s.p256dh),endpoint:s.endpoint,swScope:s.swScope,vapidKey:f(s.vapidKey)}}}}}})).close(),await E(_),await E("fcm_vapid_details_db"),await E("undefined"),_t(t)?t:null}function _t(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ot="firebase-messaging-database",Dt=1,w="firebase-messaging-store";let O=null;function L(){return O||(O=R(Ot,Dt,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(w)}}})),O}async function Se(e){const t=H(e),o=await(await L()).transaction(w).objectStore(w).get(t);if(o)return o;{const i=await Nt(e.appConfig.senderId);if(i)return await x(e,i),i}}async function x(e,t){const n=H(e),i=(await L()).transaction(w,"readwrite");return await i.objectStore(w).put(t,n),await i.done,t}async function Mt(e){const t=H(e),o=(await L()).transaction(w,"readwrite");await o.objectStore(w).delete(t),await o.done}function H({appConfig:e}){return e.appId}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pt={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},c=new te("messaging","Messaging",Pt);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Rt(e,t){const n=await B(e),o=Ae(t),i={method:"POST",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(V(e.appConfig),i)).json()}catch(a){throw c.create("token-subscribe-failed",{errorInfo:a?.toString()})}if(r.error){const a=r.error.message;throw c.create("token-subscribe-failed",{errorInfo:a})}if(!r.token)throw c.create("token-subscribe-no-token");return r.token}async function Ft(e,t){const n=await B(e),o=Ae(t.subscriptionOptions),i={method:"PATCH",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(`${V(e.appConfig)}/${t.token}`,i)).json()}catch(a){throw c.create("token-update-failed",{errorInfo:a?.toString()})}if(r.error){const a=r.error.message;throw c.create("token-update-failed",{errorInfo:a})}if(!r.token)throw c.create("token-update-no-token");return r.token}async function ve(e,t){const o={method:"DELETE",headers:await B(e)};try{const r=await(await fetch(`${V(e.appConfig)}/${t}`,o)).json();if(r.error){const a=r.error.message;throw c.create("token-unsubscribe-failed",{errorInfo:a})}}catch(i){throw c.create("token-unsubscribe-failed",{errorInfo:i?.toString()})}}function V({projectId:e}){return`${It}/projects/${e}/registrations`}async function B({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function Ae({p256dh:e,auth:t,endpoint:n,vapidKey:o}){const i={web:{endpoint:n,auth:t,p256dh:e}};return o!==ye&&(i.web.applicationPubKey=o),i}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $t=10080*60*1e3;async function Kt(e){const t=await Lt(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:f(t.getKey("auth")),p256dh:f(t.getKey("p256dh"))},o=await Se(e.firebaseDependencies);if(o){if(xt(o.subscriptionOptions,n))return Date.now()>=o.createTime+$t?qt(e,{token:o.token,createTime:Date.now(),subscriptionOptions:n}):o.token;try{await ve(e.firebaseDependencies,o.token)}catch(i){console.warn(i)}return Y(e.firebaseDependencies,n)}else return Y(e.firebaseDependencies,n)}async function jt(e){const t=await Se(e.firebaseDependencies);t&&(await ve(e.firebaseDependencies,t.token),await Mt(e.firebaseDependencies));const n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function qt(e,t){try{const n=await Ft(e.firebaseDependencies,t),o={...t,token:n,createTime:Date.now()};return await x(e.firebaseDependencies,o),n}catch(n){throw n}}async function Y(e,t){const o={token:await Rt(e,t),createTime:Date.now(),subscriptionOptions:t};return await x(e,o),o.token}async function Lt(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Et(t)})}function xt(e,t){const n=t.vapidKey===e.vapidKey,o=t.endpoint===e.endpoint,i=t.auth===e.auth,r=t.p256dh===e.p256dh;return n&&o&&i&&r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function X(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Ht(t,e),Vt(t,e),Bt(t,e),t}function Ht(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const o=t.notification.body;o&&(e.notification.body=o);const i=t.notification.image;i&&(e.notification.image=i);const r=t.notification.icon;r&&(e.notification.icon=r)}function Vt(e,t){t.data&&(e.data=t.data)}function Bt(e,t){if(!t.fcmOptions&&!t.notification?.click_action)return;e.fcmOptions={};const n=t.fcmOptions?.link??t.notification?.click_action;n&&(e.fcmOptions.link=n);const o=t.fcmOptions?.analytics_label;o&&(e.fcmOptions.analyticsLabel=o)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wt(e){return typeof e=="object"&&!!e&&Ie in e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ut(e){if(!e||!e.options)throw D("App Configuration Object");if(!e.name)throw D("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const o of t)if(!n[o])throw D(o);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function D(e){return c.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gt{constructor(t,n,o){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const i=Ut(t);this.firebaseDependencies={app:t,appConfig:i,installations:n,analyticsProvider:o}}_delete(){return Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ee(e){try{e.swRegistration=await navigator.serviceWorker.register(Tt,{scope:yt}),e.swRegistration.update().catch(()=>{}),await Jt(e.swRegistration)}catch(t){throw c.create("failed-service-worker-registration",{browserErrorMessage:t?.message})}}async function Jt(e){return new Promise((t,n)=>{const o=setTimeout(()=>n(new Error(`Service worker not registered after ${G} ms`)),G),i=e.installing||e.waiting;e.active?(clearTimeout(o),t()):i?i.onstatechange=r=>{r.target?.state==="activated"&&(i.onstatechange=null,clearTimeout(o),t())}:(clearTimeout(o),n(new Error("No incoming service worker found.")))})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function zt(e,t){if(!t&&!e.swRegistration&&await Ee(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw c.create("invalid-sw-registration");e.swRegistration=t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Yt(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=ye)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Xt(e,t){if(!navigator)throw c.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw c.create("permission-blocked");return await Yt(e,t?.vapidKey),await zt(e,t?.serviceWorkerRegistration),Kt(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Qt(e,t,n){const o=Zt(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(o,{message_id:n[Ie],message_name:n[St],message_time:n[vt],message_device_time:Math.floor(Date.now()/1e3)})}function Zt(e){switch(e){case b.NOTIFICATION_CLICKED:return"notification_open";case b.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function en(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===b.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(X(n)):e.onMessageHandler.next(X(n)));const o=n.data;Wt(o)&&o[At]==="1"&&await Qt(e,n.messageType,o)}const Q="@firebase/messaging",Z="0.12.24";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tn=e=>{const t=new Gt(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>en(t,n)),t},nn=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:o=>Xt(t,o)}};function on(){T(new y("messaging",tn,"PUBLIC")),T(new y("messaging-internal",nn,"PRIVATE")),k(Q,Z),k(Q,Z,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function rn(){try{await Oe()}catch{return!1}return typeof window<"u"&&De()&&Me()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function sn(e){if(!navigator)throw c.create("only-available-in-window");return e.swRegistration||await Ee(e),jt(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function an(e,t){if(!navigator)throw c.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function cn(e=_e()){return rn().then(t=>{if(!t)throw c.create("unsupported-browser")},t=>{throw c.create("indexed-db-unsupported")}),P(F(e),"messaging").getImmediate()}function un(e){return e=F(e),sn(e)}function dn(e,t){return e=F(e),an(e,t)}on();let S=null,ee=!1;const m=()=>{if(!ee&&ne())try{const e=Pe(Re);S=cn(e),ee=!0,console.log("Firebase Messaging initialisé")}catch(e){console.error("Erreur lors de l'initialisation de Firebase Messaging:",e)}return!!S};class h{static instance;currentToken=null;unsubscribeHandlers=[];registration=null;constructor(){m()}static getInstance(){return h.instance||(h.instance=new h),h.instance}async requestPermissionAndGetToken(){if(!m())return console.error("Firebase Messaging non disponible"),null;try{if(!("serviceWorker"in navigator))return console.error("Service Worker non supporté"),null;const t=await navigator.serviceWorker.register("/sw.js");return console.log("Service Worker enregistré pour FCM"),await Notification.requestPermission()!=="granted"?(console.warn("Permission de notification refusée"),null):(console.log("FCM prêt (token désactivé temporairement)"),"disabled")}catch(t){return console.error("Erreur lors de l'obtention du token FCM:",t),null}}async sendTokenToServer(t){try{if(!(await fetch("/api/fcm/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t})})).ok)throw new Error("Erreur lors de l'envoi du token au serveur");console.log("Token FCM envoyé au serveur avec succès")}catch(n){console.error("Erreur lors de l'envoi du token:",n)}}onMessage(t){if(!m()){console.error("Firebase Messaging non disponible");return}const n=dn(S,o=>{console.log("Message FCM reçu en avant-plan:",o),o.notification&&this.showForegroundNotification(o),t(o)});this.unsubscribeHandlers.push(n)}showForegroundNotification(t){const n=t.notification?.title||"Notification",o={body:t.notification?.body||"",icon:t.notification?.icon||"/icons/notification-bell.png",badge:"/icons/badge.png",tag:t.tag||`foreground-${Date.now()}`,requireInteraction:!1,data:t.data||{},actions:[{action:"open",title:"Ouvrir"},{action:"dismiss",title:"Ignorer"}]};if("Notification"in window&&Notification.permission==="granted"){const i=new Notification(n,o);i.onclick=r=>{r.preventDefault(),i.close();const a=t.data?.link||"/";a!=="/"&&(window.location.href=a)},setTimeout(()=>{i.close()},5e3)}}async deleteToken(){if(!m()||!this.currentToken)return!1;try{return await un(S),this.currentToken=null,localStorage.removeItem("fcm_token"),this.registration&&(await this.registration.unregister(),this.registration=null,console.log("Service Worker désenregistré")),await fetch("/api/fcm/token",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:this.currentToken})}),console.log("Token FCM supprimé avec succès"),!0}catch(t){return console.error("Erreur lors de la suppression du token FCM:",t),!1}}getCurrentToken(){return this.currentToken||localStorage.getItem("fcm_token")}isSupported(){return"Notification"in window&&"serviceWorker"in navigator&&"PushManager"in window&&ne()}cleanup(){this.unsubscribeHandlers.forEach(t=>t()),this.unsubscribeHandlers=[],this.registration&&(this.registration.unregister(),this.registration=null)}async sendTestNotification(){if(!this.currentToken){console.error("Aucun token FCM disponible");return}try{if(!(await fetch("/api/fcm/test-notification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:this.currentToken,title:"Notification de test",body:"Ceci est une notification de test de ProjectFlow",data:{type:"test",link:"/"}})})).ok)throw new Error("Erreur lors de l'envoi de la notification de test");console.log("Notification de test envoyée avec succès")}catch(t){console.error("Erreur lors de l'envoi de la notification de test:",t)}}}export{h as FirebaseCloudMessaging,h as default};
