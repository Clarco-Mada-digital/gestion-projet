const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/App.CzKG6V_j.js","_astro/dateUtils.DS5U0rni.js","_astro/index.DgOxCJIz.js","_astro/index.PHg1-2sU.js"])))=>i.map(i=>d[i]);
import{r as y,_ as I,C as S,a as F,E as re,o as K,F as Pe,g as A,b as Re,v as Fe,i as Ke,c as $e,d as C,e as h,u as U,f as G,h as J,j as ae,k as je,l as qe,m as xe}from"./dateUtils.DS5U0rni.js";import"./index.DgOxCJIz.js";const se="@firebase/installations",$="0.6.20";/**
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
 */const ce=1e4,ue=`w:${$}`,de="FIS_v2",Le="https://firebaseinstallations.googleapis.com/v1",Be=3600*1e3,He="installations",Ve="Installations";/**
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
 */const We={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},p=new re(He,Ve,We);function fe(e){return e instanceof Pe&&e.code.includes("request-failed")}/**
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
 */function le({projectId:e}){return`${Le}/projects/${e}/installations`}function pe(e){return{token:e.token,requestStatus:2,expiresIn:Ge(e.expiresIn),creationTime:Date.now()}}async function ge(e,t){const o=(await t.json()).error;return p.create("request-failed",{requestName:e,serverCode:o.code,serverMessage:o.message,serverStatus:o.status})}function we({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function Ue(e,{refreshToken:t}){const n=we(e);return n.append("Authorization",Je(t)),n}async function he(e){const t=await e();return t.status>=500&&t.status<600?e():t}function Ge(e){return Number(e.replace("s","000"))}function Je(e){return`${de} ${e}`}/**
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
 */async function ze({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const o=le(e),i=we(e),r=t.getImmediate({optional:!0});if(r){const a=await r.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={fid:n,authVersion:de,appId:e.appId,sdkVersion:ue},u={method:"POST",headers:i,body:JSON.stringify(s)},d=await he(()=>fetch(o,u));if(d.ok){const a=await d.json();return{fid:a.fid||n,registrationStatus:2,refreshToken:a.refreshToken,authToken:pe(a.authToken)}}else throw await ge("Create Installation",d)}/**
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
 */function Ye(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
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
 */const Qe=/^[cdef][\w-]{21}$/,R="";function Xe(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=Ze(e);return Qe.test(n)?n:R}catch{return R}}function Ze(e){return Ye(e).substr(0,22)}/**
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
 */const me=new Map;function ke(e,t){const n=E(e);Te(n,t),et(n,t)}function Te(e,t){const n=me.get(e);if(n)for(const o of n)o(t)}function et(e,t){const n=tt();n&&n.postMessage({key:e,fid:t}),nt()}let l=null;function tt(){return!l&&"BroadcastChannel"in self&&(l=new BroadcastChannel("[Firebase] FID Change"),l.onmessage=e=>{Te(e.data.key,e.data.fid)}),l}function nt(){me.size===0&&l&&(l.close(),l=null)}/**
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
 */const ot="firebase-installations-database",it=1,g="firebase-installations-store";let N=null;function j(){return N||(N=K(ot,it,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(g)}}})),N}async function v(e,t){const n=E(e),i=(await j()).transaction(g,"readwrite"),r=i.objectStore(g),s=await r.get(n);return await r.put(t,n),await i.done,(!s||s.fid!==t.fid)&&ke(e,t.fid),t}async function ye(e){const t=E(e),o=(await j()).transaction(g,"readwrite");await o.objectStore(g).delete(t),await o.done}async function _(e,t){const n=E(e),i=(await j()).transaction(g,"readwrite"),r=i.objectStore(g),s=await r.get(n),u=t(s);return u===void 0?await r.delete(n):await r.put(u,n),await i.done,u&&(!s||s.fid!==u.fid)&&ke(e,u.fid),u}/**
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
 */async function q(e){let t;const n=await _(e.appConfig,o=>{const i=rt(o),r=at(e,i);return t=r.registrationPromise,r.installationEntry});return n.fid===R?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function rt(e){const t=e||{fid:Xe(),registrationStatus:0};return Ie(t)}function at(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(p.create("app-offline"));return{installationEntry:t,registrationPromise:i}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},o=st(e,n);return{installationEntry:n,registrationPromise:o}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:ct(e)}:{installationEntry:t}}async function st(e,t){try{const n=await ze(e,t);return v(e.appConfig,n)}catch(n){throw fe(n)&&n.customData.serverCode===409?await ye(e.appConfig):await v(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function ct(e){let t=await z(e.appConfig);for(;t.registrationStatus===1;)await be(100),t=await z(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:o}=await q(e);return o||n}return t}function z(e){return _(e,t=>{if(!t)throw p.create("installation-not-found");return Ie(t)})}function Ie(e){return ut(e)?{fid:e.fid,registrationStatus:0}:e}function ut(e){return e.registrationStatus===1&&e.registrationTime+ce<Date.now()}/**
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
 */async function dt({appConfig:e,heartbeatServiceProvider:t},n){const o=ft(e,n),i=Ue(e,n),r=t.getImmediate({optional:!0});if(r){const a=await r.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={installation:{sdkVersion:ue,appId:e.appId}},u={method:"POST",headers:i,body:JSON.stringify(s)},d=await he(()=>fetch(o,u));if(d.ok){const a=await d.json();return pe(a)}else throw await ge("Generate Auth Token",d)}function ft(e,{fid:t}){return`${le(e)}/${t}/authTokens:generate`}/**
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
 */async function x(e,t=!1){let n;const o=await _(e.appConfig,r=>{if(!Se(r))throw p.create("not-registered");const s=r.authToken;if(!t&&gt(s))return r;if(s.requestStatus===1)return n=lt(e,t),r;{if(!navigator.onLine)throw p.create("app-offline");const u=ht(r);return n=pt(e,u),u}});return n?await n:o.authToken}async function lt(e,t){let n=await Y(e.appConfig);for(;n.authToken.requestStatus===1;)await be(100),n=await Y(e.appConfig);const o=n.authToken;return o.requestStatus===0?x(e,t):o}function Y(e){return _(e,t=>{if(!Se(t))throw p.create("not-registered");const n=t.authToken;return bt(n)?{...t,authToken:{requestStatus:0}}:t})}async function pt(e,t){try{const n=await dt(e,t),o={...t,authToken:n};return await v(e.appConfig,o),n}catch(n){if(fe(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await ye(e.appConfig);else{const o={...t,authToken:{requestStatus:0}};await v(e.appConfig,o)}throw n}}function Se(e){return e!==void 0&&e.registrationStatus===2}function gt(e){return e.requestStatus===2&&!wt(e)}function wt(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+Be}function ht(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function bt(e){return e.requestStatus===1&&e.requestTime+ce<Date.now()}/**
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
 */async function mt(e){const t=e,{installationEntry:n,registrationPromise:o}=await q(t);return o?o.catch(console.error):x(t).catch(console.error),n.fid}/**
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
 */async function kt(e,t=!1){const n=e;return await Tt(n),(await x(n,t)).token}async function Tt(e){const{registrationPromise:t}=await q(e);t&&await t}/**
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
 */function yt(e){if(!e||!e.options)throw O("App Configuration");if(!e.name)throw O("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw O(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function O(e){return p.create("missing-app-config-values",{valueName:e})}/**
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
 */const ve="installations",It="installations-internal",St=e=>{const t=e.getProvider("app").getImmediate(),n=yt(t),o=F(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:o,_delete:()=>Promise.resolve()}},vt=e=>{const t=e.getProvider("app").getImmediate(),n=F(t,ve).getImmediate();return{getId:()=>mt(n),getToken:i=>kt(n,i)}};function At(){I(new S(ve,St,"PUBLIC")),I(new S(It,vt,"PRIVATE"))}At();y(se,$);y(se,$,"esm2020");/**
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
 */const Et="/firebase-messaging-sw.js",_t="/firebase-cloud-messaging-push-scope",Ae="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Ct="https://fcmregistrations.googleapis.com/v1",Ee="google.c.a.c_id",Nt="google.c.a.c_l",Ot="google.c.a.ts",Dt="google.c.a.e",Q=1e4;var X;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(X||(X={}));/**
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
 */var k;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked"})(k||(k={}));/**
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
 */function f(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Mt(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),o=atob(n),i=new Uint8Array(o.length);for(let r=0;r<o.length;++r)i[r]=o.charCodeAt(r);return i}/**
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
 */const D="fcm_token_details_db",Pt=5,Z="fcm_token_object_Store";async function Rt(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(r=>r.name).includes(D))return null;let t=null;return(await K(D,Pt,{upgrade:async(o,i,r,s)=>{if(i<2||!o.objectStoreNames.contains(Z))return;const u=s.objectStore(Z),d=await u.index("fcmSenderId").get(e);if(await u.clear(),!!d){if(i===2){const a=d;if(!a.auth||!a.p256dh||!a.endpoint)return;t={token:a.fcmToken,createTime:a.createTime??Date.now(),subscriptionOptions:{auth:a.auth,p256dh:a.p256dh,endpoint:a.endpoint,swScope:a.swScope,vapidKey:typeof a.vapidKey=="string"?a.vapidKey:f(a.vapidKey)}}}else if(i===3){const a=d;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:f(a.auth),p256dh:f(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:f(a.vapidKey)}}}else if(i===4){const a=d;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:f(a.auth),p256dh:f(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:f(a.vapidKey)}}}}}})).close(),await C(D),await C("fcm_vapid_details_db"),await C("undefined"),Ft(t)?t:null}function Ft(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
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
 */const Kt="firebase-messaging-database",$t=1,w="firebase-messaging-store";let M=null;function L(){return M||(M=K(Kt,$t,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(w)}}})),M}async function _e(e){const t=H(e),o=await(await L()).transaction(w).objectStore(w).get(t);if(o)return o;{const i=await Rt(e.appConfig.senderId);if(i)return await B(e,i),i}}async function B(e,t){const n=H(e),i=(await L()).transaction(w,"readwrite");return await i.objectStore(w).put(t,n),await i.done,t}async function jt(e){const t=H(e),o=(await L()).transaction(w,"readwrite");await o.objectStore(w).delete(t),await o.done}function H({appConfig:e}){return e.appId}/**
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
 */const qt={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},c=new re("messaging","Messaging",qt);/**
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
 */async function xt(e,t){const n=await W(e),o=Ne(t),i={method:"POST",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(V(e.appConfig),i)).json()}catch(s){throw c.create("token-subscribe-failed",{errorInfo:s?.toString()})}if(r.error){const s=r.error.message;throw c.create("token-subscribe-failed",{errorInfo:s})}if(!r.token)throw c.create("token-subscribe-no-token");return r.token}async function Lt(e,t){const n=await W(e),o=Ne(t.subscriptionOptions),i={method:"PATCH",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(`${V(e.appConfig)}/${t.token}`,i)).json()}catch(s){throw c.create("token-update-failed",{errorInfo:s?.toString()})}if(r.error){const s=r.error.message;throw c.create("token-update-failed",{errorInfo:s})}if(!r.token)throw c.create("token-update-no-token");return r.token}async function Ce(e,t){const o={method:"DELETE",headers:await W(e)};try{const r=await(await fetch(`${V(e.appConfig)}/${t}`,o)).json();if(r.error){const s=r.error.message;throw c.create("token-unsubscribe-failed",{errorInfo:s})}}catch(i){throw c.create("token-unsubscribe-failed",{errorInfo:i?.toString()})}}function V({projectId:e}){return`${Ct}/projects/${e}/registrations`}async function W({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function Ne({p256dh:e,auth:t,endpoint:n,vapidKey:o}){const i={web:{endpoint:n,auth:t,p256dh:e}};return o!==Ae&&(i.web.applicationPubKey=o),i}/**
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
 */const Bt=10080*60*1e3;async function Ht(e){const t=await Ut(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:f(t.getKey("auth")),p256dh:f(t.getKey("p256dh"))},o=await _e(e.firebaseDependencies);if(o){if(Gt(o.subscriptionOptions,n))return Date.now()>=o.createTime+Bt?Wt(e,{token:o.token,createTime:Date.now(),subscriptionOptions:n}):o.token;try{await Ce(e.firebaseDependencies,o.token)}catch(i){console.warn(i)}return ee(e.firebaseDependencies,n)}else return ee(e.firebaseDependencies,n)}async function Vt(e){const t=await _e(e.firebaseDependencies);t&&(await Ce(e.firebaseDependencies,t.token),await jt(e.firebaseDependencies));const n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function Wt(e,t){try{const n=await Lt(e.firebaseDependencies,t),o={...t,token:n,createTime:Date.now()};return await B(e.firebaseDependencies,o),n}catch(n){throw n}}async function ee(e,t){const o={token:await xt(e,t),createTime:Date.now(),subscriptionOptions:t};return await B(e,o),o.token}async function Ut(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Mt(t)})}function Gt(e,t){const n=t.vapidKey===e.vapidKey,o=t.endpoint===e.endpoint,i=t.auth===e.auth,r=t.p256dh===e.p256dh;return n&&o&&i&&r}/**
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
 */function te(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Jt(t,e),zt(t,e),Yt(t,e),t}function Jt(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const o=t.notification.body;o&&(e.notification.body=o);const i=t.notification.image;i&&(e.notification.image=i);const r=t.notification.icon;r&&(e.notification.icon=r)}function zt(e,t){t.data&&(e.data=t.data)}function Yt(e,t){if(!t.fcmOptions&&!t.notification?.click_action)return;e.fcmOptions={};const n=t.fcmOptions?.link??t.notification?.click_action;n&&(e.fcmOptions.link=n);const o=t.fcmOptions?.analytics_label;o&&(e.fcmOptions.analyticsLabel=o)}/**
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
 */function Qt(e){return typeof e=="object"&&!!e&&Ee in e}/**
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
 */function Xt(e){if(!e||!e.options)throw P("App Configuration Object");if(!e.name)throw P("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const o of t)if(!n[o])throw P(o);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function P(e){return c.create("missing-app-config-values",{valueName:e})}/**
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
 */class Zt{constructor(t,n,o){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const i=Xt(t);this.firebaseDependencies={app:t,appConfig:i,installations:n,analyticsProvider:o}}_delete(){return Promise.resolve()}}/**
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
 */async function Oe(e){try{e.swRegistration=await navigator.serviceWorker.register(Et,{scope:_t}),e.swRegistration.update().catch(()=>{}),await en(e.swRegistration)}catch(t){throw c.create("failed-service-worker-registration",{browserErrorMessage:t?.message})}}async function en(e){return new Promise((t,n)=>{const o=setTimeout(()=>n(new Error(`Service worker not registered after ${Q} ms`)),Q),i=e.installing||e.waiting;e.active?(clearTimeout(o),t()):i?i.onstatechange=r=>{r.target?.state==="activated"&&(i.onstatechange=null,clearTimeout(o),t())}:(clearTimeout(o),n(new Error("No incoming service worker found.")))})}/**
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
 */async function tn(e,t){if(!t&&!e.swRegistration&&await Oe(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw c.create("invalid-sw-registration");e.swRegistration=t}}/**
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
 */async function nn(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=Ae)}/**
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
 */async function De(e,t){if(!navigator)throw c.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw c.create("permission-blocked");return await nn(e,t?.vapidKey),await tn(e,t?.serviceWorkerRegistration),Ht(e)}/**
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
 */async function on(e,t,n){const o=rn(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(o,{message_id:n[Ee],message_name:n[Nt],message_time:n[Ot],message_device_time:Math.floor(Date.now()/1e3)})}function rn(e){switch(e){case k.NOTIFICATION_CLICKED:return"notification_open";case k.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
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
 */async function an(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===k.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(te(n)):e.onMessageHandler.next(te(n)));const o=n.data;Qt(o)&&o[Dt]==="1"&&await on(e,n.messageType,o)}const ne="@firebase/messaging",oe="0.12.24";/**
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
 */const sn=e=>{const t=new Zt(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>an(t,n)),t},cn=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:o=>De(t,o)}};function un(){I(new S("messaging",sn,"PUBLIC")),I(new S("messaging-internal",cn,"PRIVATE")),y(ne,oe),y(ne,oe,"esm2020")}/**
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
 */async function dn(){try{await Fe()}catch{return!1}return typeof window<"u"&&Ke()&&$e()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
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
 */async function fn(e){if(!navigator)throw c.create("only-available-in-window");return e.swRegistration||await Oe(e),Vt(e)}/**
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
 */function ln(e,t){if(!navigator)throw c.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}/**
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
 */function pn(e=Re()){return dn().then(t=>{if(!t)throw c.create("unsupported-browser")},t=>{throw c.create("indexed-db-unsupported")}),F(A(e),"messaging").getImmediate()}async function gn(e,t){return e=A(e),De(e,t)}function wn(e){return e=A(e),fn(e)}function hn(e,t){return e=A(e),ln(e,t)}un();let m=null,ie=!1;const T=()=>{if(!ie&&ae())try{const e=je(qe);m=pn(e),ie=!0,console.log("Firebase Messaging initialisé")}catch(e){console.error("Erreur lors de l'initialisation de Firebase Messaging:",e)}return!!m};class b{static instance;currentToken=null;unsubscribeHandlers=[];registration=null;constructor(){T()}static getInstance(){return b.instance||(b.instance=new b),b.instance}async requestPermissionAndGetToken(){if(!T())return console.error("Firebase Messaging non disponible"),null;if(!h.currentUser)return console.log("FCM désactivé : utilisateur non connecté"),null;try{if(!("serviceWorker"in navigator))return console.error("Service Worker non supporté"),null;const{fixPath:t}=await xe(async()=>{const{fixPath:r}=await import("./App.CzKG6V_j.js").then(s=>s.cO);return{fixPath:r}},__vite__mapDeps([0,1,2,3])),n=await navigator.serviceWorker.register(t("/sw.js"),{scope:t("/")});if(console.log("Service Worker enregistré pour FCM avec scope:",n.scope),await Notification.requestPermission()!=="granted")return console.warn("Permission de notification refusée"),null;const i=await gn(m,{vapidKey:"BNDZS_Luenj7SMWjh7fuEOeK593aBTkk-8HZBhtimPtjnEl2Uk3Q-vaYFhxPb14y5EDeu3ZrJsd16XbQuUua07A",serviceWorkerRegistration:n});return i?(this.currentToken=i,console.log("Token FCM obtenu:",i),localStorage.setItem("fcm_token",i),await this.sendTokenToServer(i),i):(console.error("Impossible d'obtenir le token FCM"),null)}catch(t){return console.error("Erreur lors de l'obtention du token FCM:",t),null}}async sendTokenToServer(t){try{if(!h.currentUser)return;await U(G(J,"users",h.currentUser.uid),{fcmToken:t,updatedAt:new Date().toISOString()}),console.log("Token FCM sauvegardé dans Firestore")}catch(n){console.error("Erreur lors de la sauvegarde du token FCM:",n)}}onMessage(t){if(!T()){console.error("Firebase Messaging non disponible");return}const n=hn(m,o=>{console.log("Message FCM reçu en avant-plan:",o),o.notification&&this.showForegroundNotification(o),t(o)});this.unsubscribeHandlers.push(n)}showForegroundNotification(t){const n=t.notification?.title||"Notification",o={body:t.notification?.body||"",icon:t.notification?.icon||"/icons/icon-192x192.png",badge:"/icons/favicon-32x32.png",tag:t.tag||`foreground-${Date.now()}`,requireInteraction:!1,data:t.data||{},actions:[{action:"open",title:"Ouvrir"},{action:"dismiss",title:"Ignorer"}]};if("Notification"in window&&Notification.permission==="granted"){const i=new Notification(n,o);i.onclick=r=>{r.preventDefault(),i.close();const s=t.data?.link||"/";s!=="/"&&(window.location.href=s)},setTimeout(()=>{i.close()},5e3)}}async deleteToken(){if(!T()||!this.currentToken)return!1;try{return await wn(m),this.currentToken=null,localStorage.removeItem("fcm_token"),this.registration&&(await this.registration.unregister(),this.registration=null,console.log("Service Worker désenregistré")),h.currentUser&&await U(G(J,"users",h.currentUser.uid),{fcmToken:null,updatedAt:new Date().toISOString()}),console.log("Token FCM supprimé avec succès"),!0}catch(t){return console.error("Erreur lors de la suppression du token FCM:",t),!1}}getCurrentToken(){return this.currentToken||localStorage.getItem("fcm_token")}isSupported(){return"Notification"in window&&"serviceWorker"in navigator&&"PushManager"in window&&ae()}cleanup(){this.unsubscribeHandlers.forEach(t=>t()),this.unsubscribeHandlers=[],this.registration&&(this.registration.unregister(),this.registration=null)}async sendTestNotification(){if(!this.currentToken){console.error("Aucun token FCM disponible");return}try{if(!(await fetch("/api/fcm/test-notification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:this.currentToken,title:"Notification de test",body:"Ceci est une notification de test de ProjectFlow",data:{type:"test",link:"/"}})})).ok)throw new Error("Erreur lors de l'envoi de la notification de test");console.log("Notification de test envoyée avec succès")}catch(t){console.error("Erreur lors de l'envoi de la notification de test:",t)}}}export{b as FirebaseCloudMessaging,b as default};
