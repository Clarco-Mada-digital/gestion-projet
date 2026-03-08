import{r as y,_ as I,C as S,a as F,E as re,o as K,F as Pe,g as A,b as Re,v as Fe,i as Ke,c as $e,d as N,e as h,u as U,f as G,h as J,j as ae,k as je,l as qe}from"./dateUtils.lW9e11ee.js";import"./index.DgOxCJIz.js";const se="@firebase/installations",$="0.6.20";/**
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
 */const ce=1e4,ue=`w:${$}`,de="FIS_v2",xe="https://firebaseinstallations.googleapis.com/v1",Le=3600*1e3,Be="installations",He="Installations";/**
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
 */const Ve={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},p=new re(Be,He,Ve);function fe(e){return e instanceof Pe&&e.code.includes("request-failed")}/**
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
 */function le({projectId:e}){return`${xe}/projects/${e}/installations`}function pe(e){return{token:e.token,requestStatus:2,expiresIn:Ue(e.expiresIn),creationTime:Date.now()}}async function ge(e,t){const o=(await t.json()).error;return p.create("request-failed",{requestName:e,serverCode:o.code,serverMessage:o.message,serverStatus:o.status})}function we({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function We(e,{refreshToken:t}){const n=we(e);return n.append("Authorization",Ge(t)),n}async function he(e){const t=await e();return t.status>=500&&t.status<600?e():t}function Ue(e){return Number(e.replace("s","000"))}function Ge(e){return`${de} ${e}`}/**
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
 */async function Je({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const o=le(e),i=we(e),r=t.getImmediate({optional:!0});if(r){const a=await r.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={fid:n,authVersion:de,appId:e.appId,sdkVersion:ue},u={method:"POST",headers:i,body:JSON.stringify(s)},d=await he(()=>fetch(o,u));if(d.ok){const a=await d.json();return{fid:a.fid||n,registrationStatus:2,refreshToken:a.refreshToken,authToken:pe(a.authToken)}}else throw await ge("Create Installation",d)}/**
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
 */function be(e){return new Promise(t=>{setTimeout(t,e)})}/**
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
 */function ze(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
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
 */const Ye=/^[cdef][\w-]{21}$/,R="";function Qe(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=Xe(e);return Ye.test(n)?n:R}catch{return R}}function Xe(e){return ze(e).substr(0,22)}/**
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
 */function E(e){return`${e.appName}!${e.appId}`}/**
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
 */const ke=new Map;function me(e,t){const n=E(e);Te(n,t),Ze(n,t)}function Te(e,t){const n=ke.get(e);if(n)for(const o of n)o(t)}function Ze(e,t){const n=et();n&&n.postMessage({key:e,fid:t}),tt()}let l=null;function et(){return!l&&"BroadcastChannel"in self&&(l=new BroadcastChannel("[Firebase] FID Change"),l.onmessage=e=>{Te(e.data.key,e.data.fid)}),l}function tt(){ke.size===0&&l&&(l.close(),l=null)}/**
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
 */const nt="firebase-installations-database",ot=1,g="firebase-installations-store";let _=null;function j(){return _||(_=K(nt,ot,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(g)}}})),_}async function v(e,t){const n=E(e),i=(await j()).transaction(g,"readwrite"),r=i.objectStore(g),s=await r.get(n);return await r.put(t,n),await i.done,(!s||s.fid!==t.fid)&&me(e,t.fid),t}async function ye(e){const t=E(e),o=(await j()).transaction(g,"readwrite");await o.objectStore(g).delete(t),await o.done}async function C(e,t){const n=E(e),i=(await j()).transaction(g,"readwrite"),r=i.objectStore(g),s=await r.get(n),u=t(s);return u===void 0?await r.delete(n):await r.put(u,n),await i.done,u&&(!s||s.fid!==u.fid)&&me(e,u.fid),u}/**
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
 */async function q(e){let t;const n=await C(e.appConfig,o=>{const i=it(o),r=rt(e,i);return t=r.registrationPromise,r.installationEntry});return n.fid===R?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function it(e){const t=e||{fid:Qe(),registrationStatus:0};return Ie(t)}function rt(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(p.create("app-offline"));return{installationEntry:t,registrationPromise:i}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},o=at(e,n);return{installationEntry:n,registrationPromise:o}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:st(e)}:{installationEntry:t}}async function at(e,t){try{const n=await Je(e,t);return v(e.appConfig,n)}catch(n){throw fe(n)&&n.customData.serverCode===409?await ye(e.appConfig):await v(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function st(e){let t=await z(e.appConfig);for(;t.registrationStatus===1;)await be(100),t=await z(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:o}=await q(e);return o||n}return t}function z(e){return C(e,t=>{if(!t)throw p.create("installation-not-found");return Ie(t)})}function Ie(e){return ct(e)?{fid:e.fid,registrationStatus:0}:e}function ct(e){return e.registrationStatus===1&&e.registrationTime+ce<Date.now()}/**
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
 */async function ut({appConfig:e,heartbeatServiceProvider:t},n){const o=dt(e,n),i=We(e,n),r=t.getImmediate({optional:!0});if(r){const a=await r.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={installation:{sdkVersion:ue,appId:e.appId}},u={method:"POST",headers:i,body:JSON.stringify(s)},d=await he(()=>fetch(o,u));if(d.ok){const a=await d.json();return pe(a)}else throw await ge("Generate Auth Token",d)}function dt(e,{fid:t}){return`${le(e)}/${t}/authTokens:generate`}/**
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
 */async function x(e,t=!1){let n;const o=await C(e.appConfig,r=>{if(!Se(r))throw p.create("not-registered");const s=r.authToken;if(!t&&pt(s))return r;if(s.requestStatus===1)return n=ft(e,t),r;{if(!navigator.onLine)throw p.create("app-offline");const u=wt(r);return n=lt(e,u),u}});return n?await n:o.authToken}async function ft(e,t){let n=await Y(e.appConfig);for(;n.authToken.requestStatus===1;)await be(100),n=await Y(e.appConfig);const o=n.authToken;return o.requestStatus===0?x(e,t):o}function Y(e){return C(e,t=>{if(!Se(t))throw p.create("not-registered");const n=t.authToken;return ht(n)?{...t,authToken:{requestStatus:0}}:t})}async function lt(e,t){try{const n=await ut(e,t),o={...t,authToken:n};return await v(e.appConfig,o),n}catch(n){if(fe(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await ye(e.appConfig);else{const o={...t,authToken:{requestStatus:0}};await v(e.appConfig,o)}throw n}}function Se(e){return e!==void 0&&e.registrationStatus===2}function pt(e){return e.requestStatus===2&&!gt(e)}function gt(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+Le}function wt(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function ht(e){return e.requestStatus===1&&e.requestTime+ce<Date.now()}/**
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
 */async function bt(e){const t=e,{installationEntry:n,registrationPromise:o}=await q(t);return o?o.catch(console.error):x(t).catch(console.error),n.fid}/**
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
 */async function kt(e,t=!1){const n=e;return await mt(n),(await x(n,t)).token}async function mt(e){const{registrationPromise:t}=await q(e);t&&await t}/**
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
 */function Tt(e){if(!e||!e.options)throw O("App Configuration");if(!e.name)throw O("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw O(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function O(e){return p.create("missing-app-config-values",{valueName:e})}/**
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
 */const ve="installations",yt="installations-internal",It=e=>{const t=e.getProvider("app").getImmediate(),n=Tt(t),o=F(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:o,_delete:()=>Promise.resolve()}},St=e=>{const t=e.getProvider("app").getImmediate(),n=F(t,ve).getImmediate();return{getId:()=>bt(n),getToken:i=>kt(n,i)}};function vt(){I(new S(ve,It,"PUBLIC")),I(new S(yt,St,"PRIVATE"))}vt();y(se,$);y(se,$,"esm2020");/**
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
 */const At="/firebase-messaging-sw.js",Et="/firebase-cloud-messaging-push-scope",Ae="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Ct="https://fcmregistrations.googleapis.com/v1",Ee="google.c.a.c_id",Nt="google.c.a.c_l",_t="google.c.a.ts",Ot="google.c.a.e",Q=1e4;var X;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(X||(X={}));/**
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
 */var m;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked"})(m||(m={}));/**
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
 */function f(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Dt(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),o=atob(n),i=new Uint8Array(o.length);for(let r=0;r<o.length;++r)i[r]=o.charCodeAt(r);return i}/**
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
 */const D="fcm_token_details_db",Mt=5,Z="fcm_token_object_Store";async function Pt(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(r=>r.name).includes(D))return null;let t=null;return(await K(D,Mt,{upgrade:async(o,i,r,s)=>{if(i<2||!o.objectStoreNames.contains(Z))return;const u=s.objectStore(Z),d=await u.index("fcmSenderId").get(e);if(await u.clear(),!!d){if(i===2){const a=d;if(!a.auth||!a.p256dh||!a.endpoint)return;t={token:a.fcmToken,createTime:a.createTime??Date.now(),subscriptionOptions:{auth:a.auth,p256dh:a.p256dh,endpoint:a.endpoint,swScope:a.swScope,vapidKey:typeof a.vapidKey=="string"?a.vapidKey:f(a.vapidKey)}}}else if(i===3){const a=d;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:f(a.auth),p256dh:f(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:f(a.vapidKey)}}}else if(i===4){const a=d;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:f(a.auth),p256dh:f(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:f(a.vapidKey)}}}}}})).close(),await N(D),await N("fcm_vapid_details_db"),await N("undefined"),Rt(t)?t:null}function Rt(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
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
 */const Ft="firebase-messaging-database",Kt=1,w="firebase-messaging-store";let M=null;function L(){return M||(M=K(Ft,Kt,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(w)}}})),M}async function Ce(e){const t=H(e),o=await(await L()).transaction(w).objectStore(w).get(t);if(o)return o;{const i=await Pt(e.appConfig.senderId);if(i)return await B(e,i),i}}async function B(e,t){const n=H(e),i=(await L()).transaction(w,"readwrite");return await i.objectStore(w).put(t,n),await i.done,t}async function $t(e){const t=H(e),o=(await L()).transaction(w,"readwrite");await o.objectStore(w).delete(t),await o.done}function H({appConfig:e}){return e.appId}/**
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
 */const jt={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},c=new re("messaging","Messaging",jt);/**
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
 */async function qt(e,t){const n=await W(e),o=_e(t),i={method:"POST",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(V(e.appConfig),i)).json()}catch(s){throw c.create("token-subscribe-failed",{errorInfo:s?.toString()})}if(r.error){const s=r.error.message;throw c.create("token-subscribe-failed",{errorInfo:s})}if(!r.token)throw c.create("token-subscribe-no-token");return r.token}async function xt(e,t){const n=await W(e),o=_e(t.subscriptionOptions),i={method:"PATCH",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(`${V(e.appConfig)}/${t.token}`,i)).json()}catch(s){throw c.create("token-update-failed",{errorInfo:s?.toString()})}if(r.error){const s=r.error.message;throw c.create("token-update-failed",{errorInfo:s})}if(!r.token)throw c.create("token-update-no-token");return r.token}async function Ne(e,t){const o={method:"DELETE",headers:await W(e)};try{const r=await(await fetch(`${V(e.appConfig)}/${t}`,o)).json();if(r.error){const s=r.error.message;throw c.create("token-unsubscribe-failed",{errorInfo:s})}}catch(i){throw c.create("token-unsubscribe-failed",{errorInfo:i?.toString()})}}function V({projectId:e}){return`${Ct}/projects/${e}/registrations`}async function W({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function _e({p256dh:e,auth:t,endpoint:n,vapidKey:o}){const i={web:{endpoint:n,auth:t,p256dh:e}};return o!==Ae&&(i.web.applicationPubKey=o),i}/**
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
 */const Lt=10080*60*1e3;async function Bt(e){const t=await Wt(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:f(t.getKey("auth")),p256dh:f(t.getKey("p256dh"))},o=await Ce(e.firebaseDependencies);if(o){if(Ut(o.subscriptionOptions,n))return Date.now()>=o.createTime+Lt?Vt(e,{token:o.token,createTime:Date.now(),subscriptionOptions:n}):o.token;try{await Ne(e.firebaseDependencies,o.token)}catch(i){console.warn(i)}return ee(e.firebaseDependencies,n)}else return ee(e.firebaseDependencies,n)}async function Ht(e){const t=await Ce(e.firebaseDependencies);t&&(await Ne(e.firebaseDependencies,t.token),await $t(e.firebaseDependencies));const n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function Vt(e,t){try{const n=await xt(e.firebaseDependencies,t),o={...t,token:n,createTime:Date.now()};return await B(e.firebaseDependencies,o),n}catch(n){throw n}}async function ee(e,t){const o={token:await qt(e,t),createTime:Date.now(),subscriptionOptions:t};return await B(e,o),o.token}async function Wt(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Dt(t)})}function Ut(e,t){const n=t.vapidKey===e.vapidKey,o=t.endpoint===e.endpoint,i=t.auth===e.auth,r=t.p256dh===e.p256dh;return n&&o&&i&&r}/**
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
 */function te(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Gt(t,e),Jt(t,e),zt(t,e),t}function Gt(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const o=t.notification.body;o&&(e.notification.body=o);const i=t.notification.image;i&&(e.notification.image=i);const r=t.notification.icon;r&&(e.notification.icon=r)}function Jt(e,t){t.data&&(e.data=t.data)}function zt(e,t){if(!t.fcmOptions&&!t.notification?.click_action)return;e.fcmOptions={};const n=t.fcmOptions?.link??t.notification?.click_action;n&&(e.fcmOptions.link=n);const o=t.fcmOptions?.analytics_label;o&&(e.fcmOptions.analyticsLabel=o)}/**
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
 */function Yt(e){return typeof e=="object"&&!!e&&Ee in e}/**
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
 */function Qt(e){if(!e||!e.options)throw P("App Configuration Object");if(!e.name)throw P("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const o of t)if(!n[o])throw P(o);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function P(e){return c.create("missing-app-config-values",{valueName:e})}/**
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
 */class Xt{constructor(t,n,o){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const i=Qt(t);this.firebaseDependencies={app:t,appConfig:i,installations:n,analyticsProvider:o}}_delete(){return Promise.resolve()}}/**
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
 */async function Oe(e){try{e.swRegistration=await navigator.serviceWorker.register(At,{scope:Et}),e.swRegistration.update().catch(()=>{}),await Zt(e.swRegistration)}catch(t){throw c.create("failed-service-worker-registration",{browserErrorMessage:t?.message})}}async function Zt(e){return new Promise((t,n)=>{const o=setTimeout(()=>n(new Error(`Service worker not registered after ${Q} ms`)),Q),i=e.installing||e.waiting;e.active?(clearTimeout(o),t()):i?i.onstatechange=r=>{r.target?.state==="activated"&&(i.onstatechange=null,clearTimeout(o),t())}:(clearTimeout(o),n(new Error("No incoming service worker found.")))})}/**
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
 */async function en(e,t){if(!t&&!e.swRegistration&&await Oe(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw c.create("invalid-sw-registration");e.swRegistration=t}}/**
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
 */async function tn(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=Ae)}/**
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
 */async function De(e,t){if(!navigator)throw c.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw c.create("permission-blocked");return await tn(e,t?.vapidKey),await en(e,t?.serviceWorkerRegistration),Bt(e)}/**
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
 */async function nn(e,t,n){const o=on(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(o,{message_id:n[Ee],message_name:n[Nt],message_time:n[_t],message_device_time:Math.floor(Date.now()/1e3)})}function on(e){switch(e){case m.NOTIFICATION_CLICKED:return"notification_open";case m.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
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
 */async function rn(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===m.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(te(n)):e.onMessageHandler.next(te(n)));const o=n.data;Yt(o)&&o[Ot]==="1"&&await nn(e,n.messageType,o)}const ne="@firebase/messaging",oe="0.12.24";/**
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
 */const an=e=>{const t=new Xt(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>rn(t,n)),t},sn=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:o=>De(t,o)}};function cn(){I(new S("messaging",an,"PUBLIC")),I(new S("messaging-internal",sn,"PRIVATE")),y(ne,oe),y(ne,oe,"esm2020")}/**
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
 */async function un(){try{await Fe()}catch{return!1}return typeof window<"u"&&Ke()&&$e()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
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
 */async function dn(e){if(!navigator)throw c.create("only-available-in-window");return e.swRegistration||await Oe(e),Ht(e)}/**
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
 */function fn(e,t){if(!navigator)throw c.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}/**
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
 */function ln(e=Re()){return un().then(t=>{if(!t)throw c.create("unsupported-browser")},t=>{throw c.create("indexed-db-unsupported")}),F(A(e),"messaging").getImmediate()}async function pn(e,t){return e=A(e),De(e,t)}function gn(e){return e=A(e),dn(e)}function wn(e,t){return e=A(e),fn(e,t)}cn();let k=null,ie=!1;const T=()=>{if(!ie&&ae())try{const e=je(qe);k=ln(e),ie=!0,console.log("Firebase Messaging initialisé")}catch(e){console.error("Erreur lors de l'initialisation de Firebase Messaging:",e)}return!!k};class b{static instance;currentToken=null;unsubscribeHandlers=[];registration=null;constructor(){T()}static getInstance(){return b.instance||(b.instance=new b),b.instance}async requestPermissionAndGetToken(){if(!T())return console.error("Firebase Messaging non disponible"),null;if(!h.currentUser)return console.log("FCM désactivé : utilisateur non connecté"),null;try{if(!("serviceWorker"in navigator))return console.error("Service Worker non supporté"),null;const t=await navigator.serviceWorker.ready;if(console.log("Service Worker prêt pour FCM:",t.scope),await Notification.requestPermission()!=="granted")return console.warn("Permission de notification refusée"),null;const o=await pn(k,{vapidKey:"BNDZS_Luenj7SMWjh7fuEOeK593aBTkk-8HZBhtimPtjnEl2Uk3Q-vaYFhxPb14y5EDeu3ZrJsd16XbQuUua07A",serviceWorkerRegistration:t});return o?(this.currentToken=o,console.log("Token FCM obtenu:",o),localStorage.setItem("fcm_token",o),await this.sendTokenToServer(o),o):(console.error("Impossible d'obtenir le token FCM"),null)}catch(t){return console.error("Erreur lors de l'obtention du token FCM:",t),null}}async sendTokenToServer(t){try{if(!h.currentUser)return;await U(G(J,"users",h.currentUser.uid),{fcmToken:t,updatedAt:new Date().toISOString()}),console.log("Token FCM sauvegardé dans Firestore")}catch(n){console.error("Erreur lors de la sauvegarde du token FCM:",n)}}onMessage(t){if(!T()){console.error("Firebase Messaging non disponible");return}const n=wn(k,o=>{console.log("Message FCM reçu en avant-plan:",o),o.notification&&this.showForegroundNotification(o),t(o)});this.unsubscribeHandlers.push(n)}showForegroundNotification(t){const n=t.notification?.title||"Notification",o={body:t.notification?.body||"",icon:t.notification?.icon||"/icons/icon-192x192.png",badge:"/icons/favicon-32x32.png",tag:t.tag||`foreground-${Date.now()}`,requireInteraction:!1,data:t.data||{},actions:[{action:"open",title:"Ouvrir"},{action:"dismiss",title:"Ignorer"}]};if("Notification"in window&&Notification.permission==="granted"){const i=new Notification(n,o);i.onclick=r=>{r.preventDefault(),i.close();const s=t.data?.link||"/";s!=="/"&&(window.location.href=s)},setTimeout(()=>{i.close()},5e3)}}async deleteToken(){if(!T()||!this.currentToken)return!1;try{return await gn(k),this.currentToken=null,localStorage.removeItem("fcm_token"),this.registration&&(await this.registration.unregister(),this.registration=null,console.log("Service Worker désenregistré")),h.currentUser&&await U(G(J,"users",h.currentUser.uid),{fcmToken:null,updatedAt:new Date().toISOString()}),console.log("Token FCM supprimé avec succès"),!0}catch(t){return console.error("Erreur lors de la suppression du token FCM:",t),!1}}getCurrentToken(){return this.currentToken||localStorage.getItem("fcm_token")}isSupported(){return"Notification"in window&&"serviceWorker"in navigator&&"PushManager"in window&&ae()}cleanup(){this.unsubscribeHandlers.forEach(t=>t()),this.unsubscribeHandlers=[],this.registration&&(this.registration.unregister(),this.registration=null)}async sendTestNotification(){if(!this.currentToken){console.error("Aucun token FCM disponible");return}try{if(!(await fetch("/api/fcm/test-notification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:this.currentToken,title:"Notification de test",body:"Ceci est une notification de test de ProjectFlow",data:{type:"test",link:"/"}})})).ok)throw new Error("Erreur lors de l'envoi de la notification de test");console.log("Notification de test envoyée avec succès")}catch(t){console.error("Erreur lors de l'envoi de la notification de test:",t)}}}export{b as FirebaseCloudMessaging,b as default};
