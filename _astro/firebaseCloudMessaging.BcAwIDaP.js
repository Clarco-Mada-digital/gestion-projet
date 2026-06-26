import{r as N,_ as D,C as O,a as L,E as be,o as B,F as Ye,g as M,b as Xe,v as Ze,i as et,c as tt,d as R,e as I,u as X,f as Z,h as ee,j as ye,k as te}from"./index.C-aq45_J.js";import"./index.DgOxCJIz.js";const Te="@firebase/installations",U="0.6.22";/**
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
 */const me=1e4,ke=`w:${U}`,Ie="FIS_v2",nt="https://firebaseinstallations.googleapis.com/v1",it=3600*1e3,rt="installations",ot="Installations";/**
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
 */const at={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},h=new be(rt,ot,at);function Se(e){return e instanceof Ye&&e.code.includes("request-failed")}/**
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
 */function ve({projectId:e}){return`${nt}/projects/${e}/installations`}function Ee(e){return{token:e.token,requestStatus:2,expiresIn:ct(e.expiresIn),creationTime:Date.now()}}async function Ae(e,t){const i=(await t.json()).error;return h.create("request-failed",{requestName:e,serverCode:i.code,serverMessage:i.message,serverStatus:i.status})}function _e({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function st(e,{refreshToken:t}){const n=_e(e);return n.append("Authorization",ut(t)),n}async function Ce(e){const t=await e();return t.status>=500&&t.status<600?e():t}function ct(e){return Number(e.replace("s","000"))}function ut(e){return`${Ie} ${e}`}/**
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
 */async function dt({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const i=ve(e),r=_e(e),o=t.getImmediate({optional:!0});if(o){const s=await o.getHeartbeatsHeader();s&&r.append("x-firebase-client",s)}const a={fid:n,authVersion:Ie,appId:e.appId,sdkVersion:ke},u={method:"POST",headers:r,body:JSON.stringify(a)},d=await Ce(()=>fetch(i,u));if(d.ok){const s=await d.json();return{fid:s.fid||n,registrationStatus:2,refreshToken:s.refreshToken,authToken:Ee(s.authToken)}}else throw await Ae("Create Installation",d)}/**
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
 */function Re(e){return new Promise(t=>{setTimeout(t,e)})}/**
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
 */function ft(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
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
 */const lt=/^[cdef][\w-]{21}$/,H="";function pt(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=gt(e);return lt.test(n)?n:H}catch{return H}}function gt(e){return ft(e).substr(0,22)}/**
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
 */function T(e){return`${e.appName}!${e.appId}`}/**
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
 */const b=new Map;function Ne(e,t){const n=T(e);De(n,t),bt(n,t)}function ht(e,t){Oe();const n=T(e);let i=b.get(n);i||(i=new Set,b.set(n,i)),i.add(t)}function wt(e,t){const n=T(e),i=b.get(n);i&&(i.delete(t),i.size===0&&b.delete(n),Fe())}function De(e,t){const n=b.get(e);if(n)for(const i of n)i(t)}function bt(e,t){const n=Oe();n&&n.postMessage({key:e,fid:t}),Fe()}let g=null;function Oe(){return!g&&"BroadcastChannel"in self&&(g=new BroadcastChannel("[Firebase] FID Change"),g.onmessage=e=>{De(e.data.key,e.data.fid)}),g}function Fe(){b.size===0&&g&&(g.close(),g=null)}/**
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
 */const yt="firebase-installations-database",Tt=1,w="firebase-installations-store";let K=null;function V(){return K||(K=B(yt,Tt,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(w)}}})),K}async function F(e,t){const n=T(e),r=(await V()).transaction(w,"readwrite"),o=r.objectStore(w),a=await o.get(n);return await o.put(t,n),await r.done,(!a||a.fid!==t.fid)&&Ne(e,t.fid),t}async function Me(e){const t=T(e),i=(await V()).transaction(w,"readwrite");await i.objectStore(w).delete(t),await i.done}async function P(e,t){const n=T(e),r=(await V()).transaction(w,"readwrite"),o=r.objectStore(w),a=await o.get(n),u=t(a);return u===void 0?await o.delete(n):await o.put(u,n),await r.done,u&&(!a||a.fid!==u.fid)&&Ne(e,u.fid),u}/**
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
 */async function W(e){let t;const n=await P(e.appConfig,i=>{const r=mt(i),o=kt(e,r);return t=o.registrationPromise,o.installationEntry});return n.fid===H?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function mt(e){const t=e||{fid:pt(),registrationStatus:0};return Pe(t)}function kt(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const r=Promise.reject(h.create("app-offline"));return{installationEntry:t,registrationPromise:r}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},i=It(e,n);return{installationEntry:n,registrationPromise:i}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:St(e)}:{installationEntry:t}}async function It(e,t){try{const n=await dt(e,t);return F(e.appConfig,n)}catch(n){throw Se(n)&&n.customData.serverCode===409?await Me(e.appConfig):await F(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function St(e){let t=await ne(e.appConfig);for(;t.registrationStatus===1;)await Re(100),t=await ne(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:i}=await W(e);return i||n}return t}function ne(e){return P(e,t=>{if(!t)throw h.create("installation-not-found");return Pe(t)})}function Pe(e){return vt(e)?{fid:e.fid,registrationStatus:0}:e}function vt(e){return e.registrationStatus===1&&e.registrationTime+me<Date.now()}/**
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
 */async function Et({appConfig:e,heartbeatServiceProvider:t},n){const i=At(e,n),r=st(e,n),o=t.getImmediate({optional:!0});if(o){const s=await o.getHeartbeatsHeader();s&&r.append("x-firebase-client",s)}const a={installation:{sdkVersion:ke,appId:e.appId}},u={method:"POST",headers:r,body:JSON.stringify(a)},d=await Ce(()=>fetch(i,u));if(d.ok){const s=await d.json();return Ee(s)}else throw await Ae("Generate Auth Token",d)}function At(e,{fid:t}){return`${ve(e)}/${t}/authTokens:generate`}/**
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
 */async function G(e,t=!1){let n;const i=await P(e.appConfig,o=>{if(!Ke(o))throw h.create("not-registered");const a=o.authToken;if(!t&&Rt(a))return o;if(a.requestStatus===1)return n=_t(e,t),o;{if(!navigator.onLine)throw h.create("app-offline");const u=Dt(o);return n=Ct(e,u),u}});return n?await n:i.authToken}async function _t(e,t){let n=await ie(e.appConfig);for(;n.authToken.requestStatus===1;)await Re(100),n=await ie(e.appConfig);const i=n.authToken;return i.requestStatus===0?G(e,t):i}function ie(e){return P(e,t=>{if(!Ke(t))throw h.create("not-registered");const n=t.authToken;return Ot(n)?{...t,authToken:{requestStatus:0}}:t})}async function Ct(e,t){try{const n=await Et(e,t),i={...t,authToken:n};return await F(e.appConfig,i),n}catch(n){if(Se(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await Me(e.appConfig);else{const i={...t,authToken:{requestStatus:0}};await F(e.appConfig,i)}throw n}}function Ke(e){return e!==void 0&&e.registrationStatus===2}function Rt(e){return e.requestStatus===2&&!Nt(e)}function Nt(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+it}function Dt(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function Ot(e){return e.requestStatus===1&&e.requestTime+me<Date.now()}/**
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
 */async function Ft(e){const t=e,{installationEntry:n,registrationPromise:i}=await W(t);return i?i.catch(console.error):G(t).catch(console.error),n.fid}/**
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
 */async function Mt(e,t=!1){const n=e;return await Pt(n),(await G(n,t)).token}async function Pt(e){const{registrationPromise:t}=await W(e);t&&await t}/**
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
 */function Kt(e,t){const{appConfig:n}=e;return ht(n,t),()=>{wt(n,t)}}/**
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
 */function jt(e){if(!e||!e.options)throw j("App Configuration");if(!e.name)throw j("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw j(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function j(e){return h.create("missing-app-config-values",{valueName:e})}/**
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
 */const je="installations",xt="installations-internal",$t=e=>{const t=e.getProvider("app").getImmediate(),n=jt(t),i=L(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:i,_delete:()=>Promise.resolve()}},Ht=e=>{const t=e.getProvider("app").getImmediate(),n=L(t,je).getImmediate();return{getId:()=>Ft(n),getToken:r=>Mt(n,r)}};function qt(){D(new O(je,$t,"PUBLIC")),D(new O(xt,Ht,"PRIVATE"))}qt();N(Te,U);N(Te,U,"esm2020");/**
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
 */const Lt="/firebase-messaging-sw.js",Bt="/firebase-cloud-messaging-push-scope",xe="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Ut="https://fcmregistrations.googleapis.com/v1",$e="google.c.a.c_id",Vt="google.c.a.c_l",Wt="google.c.a.ts",Gt="google.c.a.e",re=1e4;var oe;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(oe||(oe={}));/**
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
 */var y;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked",e.FID_REGISTERED="fid-registered"})(y||(y={}));/**
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
 */function f(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function He(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),i=atob(n),r=new Uint8Array(i.length);for(let o=0;o<i.length;++o)r[o]=i.charCodeAt(o);return r}/**
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
 */const x="fcm_token_details_db",Jt=5,ae="fcm_token_object_Store";async function zt(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(o=>o.name).includes(x))return null;let t=null;return(await B(x,Jt,{upgrade:async(i,r,o,a)=>{if(r<2||!i.objectStoreNames.contains(ae))return;const u=a.objectStore(ae),d=await u.index("fcmSenderId").get(e);if(await u.clear(),!!d){if(r===2){const s=d;if(!s.auth||!s.p256dh||!s.endpoint)return;t={token:s.fcmToken,createTime:s.createTime??Date.now(),subscriptionOptions:{auth:s.auth,p256dh:s.p256dh,endpoint:s.endpoint,swScope:s.swScope,vapidKey:typeof s.vapidKey=="string"?s.vapidKey:f(s.vapidKey)}}}else if(r===3){const s=d;t={token:s.fcmToken,createTime:s.createTime,subscriptionOptions:{auth:f(s.auth),p256dh:f(s.p256dh),endpoint:s.endpoint,swScope:s.swScope,vapidKey:f(s.vapidKey)}}}else if(r===4){const s=d;t={token:s.fcmToken,createTime:s.createTime,subscriptionOptions:{auth:f(s.auth),p256dh:f(s.p256dh),endpoint:s.endpoint,swScope:s.swScope,vapidKey:f(s.vapidKey)}}}}}})).close(),await R(x),await R("fcm_vapid_details_db"),await R("undefined"),Qt(t)?t:null}function Qt(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
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
 */const Yt={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","fid-registration-failed":"A problem occurred while creating an FCM registration via FID: {$errorInfo}","fid-unregister-failed":"A problem occurred while unregistering the FCM registration via FID: {$errorInfo}","fid-registration-idb-schema-unavailable":"Unable to read or persist FID registration metadata because the messaging IndexedDB schema is unavailable (for example, the database could not be upgraded to the latest version).","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used.","invalid-on-registered-handler":"No onRegistered callback handler was provided or registered. Implement onRegistered() before register()."},c=new be("messaging","Messaging",Yt);/**
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
 */const se="firebase-messaging-database",ce=2,p="firebase-messaging-store",l="firebase-messaging-fid-registration-store",Xt={openDB:B,deleteDB:R};let ue=Xt,v=null;function Zt(e,t,n){switch(t){case 0:if(e.createObjectStore(p),n===1)break;case 1:n===2&&e.createObjectStore(l)}}function de(e){return{upgrade:(t,n)=>{Zt(t,n,e)},blocked:()=>{},blocking:(t,n,i)=>{v=null,i.target?.close()},terminated:()=>{v=null}}}function m(){return v||(v=ue.openDB(se,ce,de(2)).catch(()=>ue.openDB(se,ce-1,de(1)))),v}function qe(e,t){return e.objectStoreNames.contains(t)}function J(e){if(!qe(e,l))throw c.create("fid-registration-idb-schema-unavailable")}async function Le(e){const t=k(e),i=await(await m()).transaction(p).objectStore(p).get(t);if(i)return i;{const r=await zt(e.appConfig.senderId);if(r)return await z(e,r),r}}async function z(e,t){const n=k(e),i=await m(),r=[p],o=qe(i,l);o&&r.push(l);const a=i.transaction(r,"readwrite");return await a.objectStore(p).put(t,n),o&&await a.objectStore(l).delete(n),await a.done,t}async function en(e){const t=k(e),i=(await m()).transaction(p,"readwrite");await i.objectStore(p).delete(t),await i.done}async function Q(e){const t=k(e),n=await m();return J(n),await n.transaction(l).objectStore(l).get(t)}async function tn(e,t){const n=k(e),i=await m();J(i);const r=i.transaction([p,l],"readwrite");return await r.objectStore(l).put(t,n),await r.objectStore(p).delete(n),await r.done,t}async function nn(e){const t=k(e),n=await m();J(n);const i=n.transaction(l,"readwrite");await i.objectStore(l).delete(t),await i.done}function k({appConfig:e}){return e.appId}const fe="@firebase/messaging",q="0.13.0";/**
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
 */const rn=3,on=1e3;async function an(e,t){const n=await _(e),i=Y(t,e.appConfig.appName,!1),r={method:"POST",headers:n,body:JSON.stringify(i)};let o;try{o=await(await fetch(A(e.appConfig),r)).json()}catch(a){throw c.create("token-subscribe-failed",{errorInfo:a?.toString()})}if(o.error){const a=o.error.message;throw c.create("token-subscribe-failed",{errorInfo:a})}if(!o.token)throw c.create("token-subscribe-no-token");return o.token}async function sn(e,t){const n=await _(e),i=Y(t,e.appConfig.appName,!0),r={method:"POST",headers:n,body:JSON.stringify(i)};let o;try{o=await ln(()=>fetch(A(e.appConfig),r),rn,on)}catch(d){throw c.create("fid-registration-failed",{errorInfo:d?.toString()})}if(o.ok)return{responseFid:await un(o)};let a;try{a=await o.json()}catch{throw c.create("fid-registration-failed",{errorInfo:o.statusText})}const u=a.error?.message??o.statusText;throw c.create("fid-registration-failed",{errorInfo:u})}async function cn(e,t){const i={method:"DELETE",headers:await _(e)};let r;try{r=await fetch(`${A(e.appConfig)}/${t}`,i)}catch(o){throw c.create("fid-unregister-failed",{errorInfo:o?.toString()})}if(!r.ok)try{throw(await r.json()).error?.message??r.statusText}catch(o){throw c.create("fid-unregister-failed",{errorInfo:typeof o=="string"&&o||r.statusText||o?.toString()})}}async function un(e){const t=await e.text();if(!t.trim())throw c.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is empty"});let n;try{n=JSON.parse(t)}catch{throw c.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is not valid JSON"})}const i=n.name;if(typeof i!="string"||i.length===0)throw c.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response did not include a non-empty name"});return dn(i)}const le="/registrations/";function dn(e){const t=e.indexOf(le);if(t!==-1){const n=e.slice(t+le.length);if(n.length>0)return n}throw c.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response name is not a valid registration resource name"})}async function fn(e,t){const n=await _(e),i=Y(t.subscriptionOptions,e.appConfig.appName,!1),r={method:"PATCH",headers:n,body:JSON.stringify(i)};let o;try{o=await(await fetch(`${A(e.appConfig)}/${t.token}`,r)).json()}catch(a){throw c.create("token-update-failed",{errorInfo:a?.toString()})}if(o.error){const a=o.error.message;throw c.create("token-update-failed",{errorInfo:a})}if(!o.token)throw c.create("token-update-no-token");return o.token}async function Be(e,t){const i={method:"DELETE",headers:await _(e)};try{const o=await(await fetch(`${A(e.appConfig)}/${t}`,i)).json();if(o.error){const a=o.error.message;throw c.create("token-unsubscribe-failed",{errorInfo:a})}}catch(r){throw c.create("token-unsubscribe-failed",{errorInfo:r?.toString()})}}async function ln(e,t,n){let i;for(let r=0;r<t;r++)try{return await e()}catch(o){if(i=o,r<t-1){const a=n*Math.pow(2,r);await new Promise(u=>setTimeout(u,a))}}throw i}function A({projectId:e}){return`${Ut}/projects/${e}/registrations`}async function _({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function pn(e,t){try{if(/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(e))return new URL(e).host}catch{}try{if(typeof self<"u"&&self.location?.href)return new URL(e,self.location.origin).host}catch{}return typeof self<"u"&&self.location?.host?self.location.host:t}function Y({p256dh:e,auth:t,endpoint:n,vapidKey:i,swScope:r},o,a){const u={web:{origin:pn(r,o),endpoint:n,auth:t,p256dh:e}};return a&&(u.fcm_sdk_version=q),i!==xe&&(u.web.applicationPubKey=i),u}/**
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
 */const gn=10080*60*1e3;async function hn(e){const t=await mn(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:f(t.getKey("auth")),p256dh:f(t.getKey("p256dh"))},i=await Le(e.firebaseDependencies);if(i){if(kn(i.subscriptionOptions,n))return Date.now()>=i.createTime+gn?Tn(e,{token:i.token,createTime:Date.now(),subscriptionOptions:n}):i.token;try{await Be(e.firebaseDependencies,i.token)}catch(r){console.warn(r)}return pe(e.firebaseDependencies,n)}else return pe(e.firebaseDependencies,n)}async function wn(e,t){await Be(e.firebaseDependencies,t.token),await en(e.firebaseDependencies),await Ue(e.firebaseDependencies)}async function bn(e){const n=(await Q(e.firebaseDependencies).catch(()=>{}))?.fid;n&&await cn(e.firebaseDependencies,n),await Ue(e.firebaseDependencies),n&&Sn(e,n)}async function yn(e){const t=await Le(e.firebaseDependencies);t?await wn(e,t):await bn(e);const n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function Tn(e,t){try{const n=await fn(e.firebaseDependencies,t),i={...t,token:n,createTime:Date.now()};return await z(e.firebaseDependencies,i),n}catch(n){throw n}}async function pe(e,t){const i={token:await an(e,t),createTime:Date.now(),subscriptionOptions:t};return await z(e,i),i.token}async function mn(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:He(t)})}function kn(e,t){const n=t.vapidKey===e.vapidKey,i=t.endpoint===e.endpoint,r=t.auth===e.auth,o=t.p256dh===e.p256dh;return n&&i&&r&&o}async function Ue(e){try{await nn(e)}catch{}}function In(e,t){const n=e.onRegisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}function Sn(e,t){const n=e.onUnregisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}/**
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
 */async function Ve(e){try{e.swRegistration=await navigator.serviceWorker.register(Lt,{scope:Bt}),e.swRegistration.update().catch(()=>{}),await vn(e.swRegistration)}catch(t){throw c.create("failed-service-worker-registration",{browserErrorMessage:t?.message})}}async function vn(e){return new Promise((t,n)=>{const i=setTimeout(()=>n(new Error(`Service worker not registered after ${re} ms`)),re),r=e.installing||e.waiting;e.active?(clearTimeout(i),t()):r?r.onstatechange=o=>{o.target?.state==="activated"&&(r.onstatechange=null,clearTimeout(i),t())}:(clearTimeout(i),n(new Error("No incoming service worker found.")))})}/**
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
 */async function We(e,t){if(!t&&!e.swRegistration&&await Ve(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw c.create("invalid-sw-registration");e.swRegistration=t}}/**
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
 */async function Ge(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=xe)}/**
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
 */const ge=3;async function En(e,t){const n=await An(e.swRegistration,e.vapidKey),i={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:n.endpoint,auth:f(n.getKey("auth")),p256dh:f(n.getKey("p256dh"))},r=e.firebaseDependencies.installations;for(let o=0;o<ge;o++){const{responseFid:a}=await sn(e.firebaseDependencies,i);if(a===t)return;o<ge-1&&await r.getToken(!0)}throw c.create("fid-registration-failed",{errorInfo:"CreateRegistration response FID does not match Firebase Installation ID"})}async function An(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:He(t)})}/**
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
 */const _n=10080*60*1e3;async function Je(e,t){if(!navigator)throw c.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw c.create("permission-blocked");if(!e.onRegisteredHandler)throw c.create("invalid-on-registered-handler");await Ge(e,t?.vapidKey),await We(e,t?.serviceWorkerRegistration);const n=e._registerNotifyChain.catch(()=>{});return e._registerNotifyChain=n.then(async()=>{const i=await e.firebaseDependencies.installations.getId(),r=await Q(e.firebaseDependencies),o=Date.now();if((!r||r.fid!==i||o>=r.lastRegisterTime+_n)&&(await En(e,i),await tn(e.firebaseDependencies,{fid:i,lastRegisterTime:o,vapidKey:e.vapidKey})),!e.onRegisteredHandler)throw c.create("invalid-on-registered-handler");In(e,i)}),e._registerNotifyChain}/**
 * @license
 * Copyright 2026 Google LLC
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
 */function Cn(e,t){return Kt(t,()=>{(async()=>!e.onRegisteredHandler||!await Q(e.firebaseDependencies)||await Je(e).catch(()=>{}))()})}/**
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
 */function he(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Rn(t,e),Nn(t,e),Dn(t,e),t}function Rn(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const i=t.notification.body;i&&(e.notification.body=i);const r=t.notification.image;r&&(e.notification.image=r);const o=t.notification.icon;o&&(e.notification.icon=o)}function Nn(e,t){t.data&&(e.data=t.data)}function Dn(e,t){if(!t.fcmOptions&&!t.notification?.click_action)return;e.fcmOptions={};const n=t.fcmOptions?.link??t.notification?.click_action;n&&(e.fcmOptions.link=n);const i=t.fcmOptions?.analytics_label;i&&(e.fcmOptions.analyticsLabel=i)}/**
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
 */function On(e){return typeof e=="object"&&!!e&&$e in e}/**
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
 */function Fn(e){if(!e||!e.options)throw $("App Configuration Object");if(!e.name)throw $("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const i of t)if(!n[i])throw $(i);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function $(e){return c.create("missing-app-config-values",{valueName:e})}/**
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
 */class Mn{constructor(t,n,i){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.onRegisteredHandler=null,this.onUnregisteredHandler=null,this._registerNotifyChain=Promise.resolve(),this._fidChangeUnsubscribe=null,this.logEvents=[],this.logQueue={state:"stopped"};const r=Fn(t);this.firebaseDependencies={app:t,appConfig:r,installations:n,analyticsProvider:i}}_delete(){return this._fidChangeUnsubscribe&&(this._fidChangeUnsubscribe(),this._fidChangeUnsubscribe=null),this.logQueue.state==="scheduled"&&clearTimeout(this.logQueue.timerId),this.logQueue={state:"stopped"},Promise.resolve()}}/**
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
 */async function ze(e,t){if(!navigator)throw c.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw c.create("permission-blocked");return await Ge(e,t?.vapidKey),await We(e,t?.serviceWorkerRegistration),hn(e)}/**
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
 */async function Pn(e,t,n){const i=Kn(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(i,{message_id:n[$e],message_name:n[Vt],message_time:n[Wt],message_device_time:Math.floor(Date.now()/1e3)})}function Kn(e){switch(e){case y.NOTIFICATION_CLICKED:return"notification_open";case y.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
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
 */async function jn(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;if(e.onMessageHandler&&n.messageType===y.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(he(n)):e.onMessageHandler.next(he(n))),e.onRegisteredHandler&&n.messageType===y.FID_REGISTERED){const r=n.fid;typeof e.onRegisteredHandler=="function"?e.onRegisteredHandler(r):e.onRegisteredHandler.next(r)}const i=n.data;On(i)&&i[Gt]==="1"&&await Pn(e,n.messageType,i)}/**
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
 */const xn=e=>{const t=new Mn(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>jn(t,n)),t._fidChangeUnsubscribe=Cn(t,e.getProvider("installations").getImmediate()),t},$n=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:i=>ze(t,i),register:i=>Je(t,i)}};function Hn(){D(new O("messaging",xn,"PUBLIC")),D(new O("messaging-internal",$n,"PRIVATE")),N(fe,q),N(fe,q,"esm2020")}/**
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
 */async function qn(){try{await Ze()}catch{return!1}return typeof window<"u"&&et()&&tt()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
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
 */async function Ln(e){if(!navigator)throw c.create("only-available-in-window");return e.swRegistration||await Ve(e),yn(e)}/**
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
 */function Bn(e,t){if(!navigator)throw c.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}/**
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
 */function Un(e=Xe()){return qn().then(t=>{if(!t)throw c.create("unsupported-browser")},t=>{throw c.create("indexed-db-unsupported")}),L(M(e),"messaging").getImmediate()}async function Vn(e,t){return e=M(e),ze(e,t)}function Wn(e){return e=M(e),Ln(e)}function Gn(e,t){return e=M(e),Bn(e,t)}Hn();let E=null,we=!1;const C=()=>{if(!we&&ye())try{te&&(E=Un(te),we=!0,console.log("Firebase Messaging initialisé via app centralisée"))}catch(e){console.error("Erreur lors de l'initialisation de Firebase Messaging:",e)}return!!E};class S{static instance;currentToken=null;unsubscribeHandlers=[];registration=null;constructor(){C()}static getInstance(){return S.instance||(S.instance=new S),S.instance}async requestPermissionAndGetToken(){if(!C())return console.error("Firebase Messaging non disponible"),null;if(!I.currentUser)return console.log("FCM désactivé : utilisateur non connecté"),null;try{if(!("serviceWorker"in navigator))return console.error("Service Worker non supporté"),null;const t=await navigator.serviceWorker.ready;if(console.log("Service Worker prêt pour FCM:",t.scope),await Notification.requestPermission()!=="granted")return console.warn("Permission de notification refusée"),null;const i=await Vn(E,{vapidKey:"BNDZS_Luenj7SMWjh7fuEOeK593aBTkk-8HZBhtimPtjnEl2Uk3Q-vaYFhxPb14y5EDeu3ZrJsd16XbQuUua07A",serviceWorkerRegistration:t});return i?(this.currentToken=i,console.log("Token FCM obtenu:",i),localStorage.setItem("fcm_token",i),await this.sendTokenToServer(i),i):(console.error("Impossible d'obtenir le token FCM"),null)}catch(t){return console.error("Erreur lors de l'obtention du token FCM:",t),null}}async sendTokenToServer(t){try{if(!I.currentUser)return;await X(Z(ee,"users",I.currentUser.uid),{fcmToken:t,updatedAt:new Date().toISOString()}),console.log("Token FCM sauvegardé dans Firestore")}catch(n){console.error("Erreur lors de la sauvegarde du token FCM:",n)}}onMessage(t){if(!C()){console.error("Firebase Messaging non disponible");return}const n=Gn(E,i=>{console.log("Message FCM reçu en avant-plan:",i),i.notification&&this.showForegroundNotification(i),t(i)});this.unsubscribeHandlers.push(n)}showForegroundNotification(t){const n=t.notification?.title||"Notification",i={body:t.notification?.body||"",icon:t.notification?.icon||"/icons/icon-192x192.png",badge:"/icons/favicon-32x32.png",tag:t.tag||`foreground-${Date.now()}`,requireInteraction:!1,data:t.data||{},actions:[{action:"open",title:"Ouvrir"},{action:"dismiss",title:"Ignorer"}]};if("Notification"in window&&Notification.permission==="granted"){const r=new Notification(n,i);r.onclick=o=>{o.preventDefault(),r.close();const a=t.data?.link||"/";a!=="/"&&(window.location.href=a)},setTimeout(()=>{r.close()},5e3)}}async deleteToken(){if(!C()||!this.currentToken)return!1;try{return await Wn(E),this.currentToken=null,localStorage.removeItem("fcm_token"),this.registration&&(await this.registration.unregister(),this.registration=null,console.log("Service Worker désenregistré")),I.currentUser&&await X(Z(ee,"users",I.currentUser.uid),{fcmToken:null,updatedAt:new Date().toISOString()}),console.log("Token FCM supprimé avec succès"),!0}catch(t){return console.error("Erreur lors de la suppression du token FCM:",t),!1}}getCurrentToken(){return this.currentToken||localStorage.getItem("fcm_token")}isSupported(){return"Notification"in window&&"serviceWorker"in navigator&&"PushManager"in window&&ye()}cleanup(){this.unsubscribeHandlers.forEach(t=>t()),this.unsubscribeHandlers=[],this.registration&&(this.registration.unregister(),this.registration=null)}async sendTestNotification(){if(!this.currentToken){console.error("Aucun token FCM disponible");return}try{if(!(await fetch("/api/fcm/test-notification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:this.currentToken,title:"Notification de test",body:"Ceci est une notification de test de ProjectFlow",data:{type:"test",link:"/"}})})).ok)throw new Error("Erreur lors de l'envoi de la notification de test");console.log("Notification de test envoyée avec succès")}catch(t){console.error("Erreur lors de l'envoi de la notification de test:",t)}}}export{S as FirebaseCloudMessaging,S as default};
