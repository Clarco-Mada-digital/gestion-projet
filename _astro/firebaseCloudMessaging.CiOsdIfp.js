import{r as T,_ as y,C as I,a as R,E as ne,o as F,F as Oe,g as v,b as De,v as Me,i as Pe,c as Re,d as C,e as oe,f as Fe,h as Ke}from"./dateUtils.CLtdeGqO.js";import"./index.DgOxCJIz.js";const ie="@firebase/installations",K="0.6.20";/**
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
 */const re=1e4,ae=`w:${K}`,se="FIS_v2",$e="https://firebaseinstallations.googleapis.com/v1",qe=3600*1e3,je="installations",Le="Installations";/**
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
 */const Ve={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},p=new ne(je,Le,Ve);function ce(e){return e instanceof Oe&&e.code.includes("request-failed")}/**
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
 */function ue({projectId:e}){return`${$e}/projects/${e}/installations`}function de(e){return{token:e.token,requestStatus:2,expiresIn:He(e.expiresIn),creationTime:Date.now()}}async function fe(e,t){const o=(await t.json()).error;return p.create("request-failed",{requestName:e,serverCode:o.code,serverMessage:o.message,serverStatus:o.status})}function le({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function xe(e,{refreshToken:t}){const n=le(e);return n.append("Authorization",Be(t)),n}async function pe(e){const t=await e();return t.status>=500&&t.status<600?e():t}function He(e){return Number(e.replace("s","000"))}function Be(e){return`${se} ${e}`}/**
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
 */async function We({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const o=ue(e),i=le(e),r=t.getImmediate({optional:!0});if(r){const a=await r.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={fid:n,authVersion:se,appId:e.appId,sdkVersion:ae},u={method:"POST",headers:i,body:JSON.stringify(s)},d=await pe(()=>fetch(o,u));if(d.ok){const a=await d.json();return{fid:a.fid||n,registrationStatus:2,refreshToken:a.refreshToken,authToken:de(a.authToken)}}else throw await fe("Create Installation",d)}/**
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
 */function ge(e){return new Promise(t=>{setTimeout(t,e)})}/**
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
 */function Ue(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
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
 */const Ge=/^[cdef][\w-]{21}$/,P="";function Je(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=ze(e);return Ge.test(n)?n:P}catch{return P}}function ze(e){return Ue(e).substr(0,22)}/**
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
 */function A(e){return`${e.appName}!${e.appId}`}/**
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
 */const we=new Map;function he(e,t){const n=A(e);be(n,t),Ye(n,t)}function be(e,t){const n=we.get(e);if(n)for(const o of n)o(t)}function Ye(e,t){const n=Xe();n&&n.postMessage({key:e,fid:t}),Qe()}let l=null;function Xe(){return!l&&"BroadcastChannel"in self&&(l=new BroadcastChannel("[Firebase] FID Change"),l.onmessage=e=>{be(e.data.key,e.data.fid)}),l}function Qe(){we.size===0&&l&&(l.close(),l=null)}/**
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
 */const Ze="firebase-installations-database",et=1,g="firebase-installations-store";let N=null;function $(){return N||(N=F(Ze,et,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(g)}}})),N}async function S(e,t){const n=A(e),i=(await $()).transaction(g,"readwrite"),r=i.objectStore(g),s=await r.get(n);return await r.put(t,n),await i.done,(!s||s.fid!==t.fid)&&he(e,t.fid),t}async function ke(e){const t=A(e),o=(await $()).transaction(g,"readwrite");await o.objectStore(g).delete(t),await o.done}async function E(e,t){const n=A(e),i=(await $()).transaction(g,"readwrite"),r=i.objectStore(g),s=await r.get(n),u=t(s);return u===void 0?await r.delete(n):await r.put(u,n),await i.done,u&&(!s||s.fid!==u.fid)&&he(e,u.fid),u}/**
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
 */async function q(e){let t;const n=await E(e.appConfig,o=>{const i=tt(o),r=nt(e,i);return t=r.registrationPromise,r.installationEntry});return n.fid===P?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function tt(e){const t=e||{fid:Je(),registrationStatus:0};return me(t)}function nt(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(p.create("app-offline"));return{installationEntry:t,registrationPromise:i}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},o=ot(e,n);return{installationEntry:n,registrationPromise:o}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:it(e)}:{installationEntry:t}}async function ot(e,t){try{const n=await We(e,t);return S(e.appConfig,n)}catch(n){throw ce(n)&&n.customData.serverCode===409?await ke(e.appConfig):await S(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function it(e){let t=await W(e.appConfig);for(;t.registrationStatus===1;)await ge(100),t=await W(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:o}=await q(e);return o||n}return t}function W(e){return E(e,t=>{if(!t)throw p.create("installation-not-found");return me(t)})}function me(e){return rt(e)?{fid:e.fid,registrationStatus:0}:e}function rt(e){return e.registrationStatus===1&&e.registrationTime+re<Date.now()}/**
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
 */async function at({appConfig:e,heartbeatServiceProvider:t},n){const o=st(e,n),i=xe(e,n),r=t.getImmediate({optional:!0});if(r){const a=await r.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={installation:{sdkVersion:ae,appId:e.appId}},u={method:"POST",headers:i,body:JSON.stringify(s)},d=await pe(()=>fetch(o,u));if(d.ok){const a=await d.json();return de(a)}else throw await fe("Generate Auth Token",d)}function st(e,{fid:t}){return`${ue(e)}/${t}/authTokens:generate`}/**
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
 */async function j(e,t=!1){let n;const o=await E(e.appConfig,r=>{if(!Te(r))throw p.create("not-registered");const s=r.authToken;if(!t&&dt(s))return r;if(s.requestStatus===1)return n=ct(e,t),r;{if(!navigator.onLine)throw p.create("app-offline");const u=lt(r);return n=ut(e,u),u}});return n?await n:o.authToken}async function ct(e,t){let n=await U(e.appConfig);for(;n.authToken.requestStatus===1;)await ge(100),n=await U(e.appConfig);const o=n.authToken;return o.requestStatus===0?j(e,t):o}function U(e){return E(e,t=>{if(!Te(t))throw p.create("not-registered");const n=t.authToken;return pt(n)?{...t,authToken:{requestStatus:0}}:t})}async function ut(e,t){try{const n=await at(e,t),o={...t,authToken:n};return await S(e.appConfig,o),n}catch(n){if(ce(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await ke(e.appConfig);else{const o={...t,authToken:{requestStatus:0}};await S(e.appConfig,o)}throw n}}function Te(e){return e!==void 0&&e.registrationStatus===2}function dt(e){return e.requestStatus===2&&!ft(e)}function ft(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+qe}function lt(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function pt(e){return e.requestStatus===1&&e.requestTime+re<Date.now()}/**
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
 */async function gt(e){const t=e,{installationEntry:n,registrationPromise:o}=await q(t);return o?o.catch(console.error):j(t).catch(console.error),n.fid}/**
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
 */async function wt(e,t=!1){const n=e;return await ht(n),(await j(n,t)).token}async function ht(e){const{registrationPromise:t}=await q(e);t&&await t}/**
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
 */function bt(e){if(!e||!e.options)throw _("App Configuration");if(!e.name)throw _("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw _(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function _(e){return p.create("missing-app-config-values",{valueName:e})}/**
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
 */const ye="installations",kt="installations-internal",mt=e=>{const t=e.getProvider("app").getImmediate(),n=bt(t),o=R(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:o,_delete:()=>Promise.resolve()}},Tt=e=>{const t=e.getProvider("app").getImmediate(),n=R(t,ye).getImmediate();return{getId:()=>gt(n),getToken:i=>wt(n,i)}};function yt(){y(new I(ye,mt,"PUBLIC")),y(new I(kt,Tt,"PRIVATE"))}yt();T(ie,K);T(ie,K,"esm2020");/**
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
 */const It="/firebase-messaging-sw.js",St="/firebase-cloud-messaging-push-scope",Ie="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",vt="https://fcmregistrations.googleapis.com/v1",Se="google.c.a.c_id",At="google.c.a.c_l",Et="google.c.a.ts",Ct="google.c.a.e",G=1e4;var J;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(J||(J={}));/**
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
 */function f(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Nt(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),o=atob(n),i=new Uint8Array(o.length);for(let r=0;r<o.length;++r)i[r]=o.charCodeAt(r);return i}/**
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
 */const O="fcm_token_details_db",_t=5,z="fcm_token_object_Store";async function Ot(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(r=>r.name).includes(O))return null;let t=null;return(await F(O,_t,{upgrade:async(o,i,r,s)=>{if(i<2||!o.objectStoreNames.contains(z))return;const u=s.objectStore(z),d=await u.index("fcmSenderId").get(e);if(await u.clear(),!!d){if(i===2){const a=d;if(!a.auth||!a.p256dh||!a.endpoint)return;t={token:a.fcmToken,createTime:a.createTime??Date.now(),subscriptionOptions:{auth:a.auth,p256dh:a.p256dh,endpoint:a.endpoint,swScope:a.swScope,vapidKey:typeof a.vapidKey=="string"?a.vapidKey:f(a.vapidKey)}}}else if(i===3){const a=d;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:f(a.auth),p256dh:f(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:f(a.vapidKey)}}}else if(i===4){const a=d;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:f(a.auth),p256dh:f(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:f(a.vapidKey)}}}}}})).close(),await C(O),await C("fcm_vapid_details_db"),await C("undefined"),Dt(t)?t:null}function Dt(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
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
 */const Mt="firebase-messaging-database",Pt=1,w="firebase-messaging-store";let D=null;function L(){return D||(D=F(Mt,Pt,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(w)}}})),D}async function ve(e){const t=x(e),o=await(await L()).transaction(w).objectStore(w).get(t);if(o)return o;{const i=await Ot(e.appConfig.senderId);if(i)return await V(e,i),i}}async function V(e,t){const n=x(e),i=(await L()).transaction(w,"readwrite");return await i.objectStore(w).put(t,n),await i.done,t}async function Rt(e){const t=x(e),o=(await L()).transaction(w,"readwrite");await o.objectStore(w).delete(t),await o.done}function x({appConfig:e}){return e.appId}/**
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
 */const Ft={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},c=new ne("messaging","Messaging",Ft);/**
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
 */async function Kt(e,t){const n=await B(e),o=Ee(t),i={method:"POST",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(H(e.appConfig),i)).json()}catch(s){throw c.create("token-subscribe-failed",{errorInfo:s?.toString()})}if(r.error){const s=r.error.message;throw c.create("token-subscribe-failed",{errorInfo:s})}if(!r.token)throw c.create("token-subscribe-no-token");return r.token}async function $t(e,t){const n=await B(e),o=Ee(t.subscriptionOptions),i={method:"PATCH",headers:n,body:JSON.stringify(o)};let r;try{r=await(await fetch(`${H(e.appConfig)}/${t.token}`,i)).json()}catch(s){throw c.create("token-update-failed",{errorInfo:s?.toString()})}if(r.error){const s=r.error.message;throw c.create("token-update-failed",{errorInfo:s})}if(!r.token)throw c.create("token-update-no-token");return r.token}async function Ae(e,t){const o={method:"DELETE",headers:await B(e)};try{const r=await(await fetch(`${H(e.appConfig)}/${t}`,o)).json();if(r.error){const s=r.error.message;throw c.create("token-unsubscribe-failed",{errorInfo:s})}}catch(i){throw c.create("token-unsubscribe-failed",{errorInfo:i?.toString()})}}function H({projectId:e}){return`${vt}/projects/${e}/registrations`}async function B({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function Ee({p256dh:e,auth:t,endpoint:n,vapidKey:o}){const i={web:{endpoint:n,auth:t,p256dh:e}};return o!==Ie&&(i.web.applicationPubKey=o),i}/**
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
 */const qt=10080*60*1e3;async function jt(e){const t=await xt(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:f(t.getKey("auth")),p256dh:f(t.getKey("p256dh"))},o=await ve(e.firebaseDependencies);if(o){if(Ht(o.subscriptionOptions,n))return Date.now()>=o.createTime+qt?Vt(e,{token:o.token,createTime:Date.now(),subscriptionOptions:n}):o.token;try{await Ae(e.firebaseDependencies,o.token)}catch(i){console.warn(i)}return Y(e.firebaseDependencies,n)}else return Y(e.firebaseDependencies,n)}async function Lt(e){const t=await ve(e.firebaseDependencies);t&&(await Ae(e.firebaseDependencies,t.token),await Rt(e.firebaseDependencies));const n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function Vt(e,t){try{const n=await $t(e.firebaseDependencies,t),o={...t,token:n,createTime:Date.now()};return await V(e.firebaseDependencies,o),n}catch(n){throw n}}async function Y(e,t){const o={token:await Kt(e,t),createTime:Date.now(),subscriptionOptions:t};return await V(e,o),o.token}async function xt(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Nt(t)})}function Ht(e,t){const n=t.vapidKey===e.vapidKey,o=t.endpoint===e.endpoint,i=t.auth===e.auth,r=t.p256dh===e.p256dh;return n&&o&&i&&r}/**
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
 */function X(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Bt(t,e),Wt(t,e),Ut(t,e),t}function Bt(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const o=t.notification.body;o&&(e.notification.body=o);const i=t.notification.image;i&&(e.notification.image=i);const r=t.notification.icon;r&&(e.notification.icon=r)}function Wt(e,t){t.data&&(e.data=t.data)}function Ut(e,t){if(!t.fcmOptions&&!t.notification?.click_action)return;e.fcmOptions={};const n=t.fcmOptions?.link??t.notification?.click_action;n&&(e.fcmOptions.link=n);const o=t.fcmOptions?.analytics_label;o&&(e.fcmOptions.analyticsLabel=o)}/**
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
 */function Gt(e){return typeof e=="object"&&!!e&&Se in e}/**
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
 */function Jt(e){if(!e||!e.options)throw M("App Configuration Object");if(!e.name)throw M("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const o of t)if(!n[o])throw M(o);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function M(e){return c.create("missing-app-config-values",{valueName:e})}/**
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
 */class zt{constructor(t,n,o){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const i=Jt(t);this.firebaseDependencies={app:t,appConfig:i,installations:n,analyticsProvider:o}}_delete(){return Promise.resolve()}}/**
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
 */async function Ce(e){try{e.swRegistration=await navigator.serviceWorker.register(It,{scope:St}),e.swRegistration.update().catch(()=>{}),await Yt(e.swRegistration)}catch(t){throw c.create("failed-service-worker-registration",{browserErrorMessage:t?.message})}}async function Yt(e){return new Promise((t,n)=>{const o=setTimeout(()=>n(new Error(`Service worker not registered after ${G} ms`)),G),i=e.installing||e.waiting;e.active?(clearTimeout(o),t()):i?i.onstatechange=r=>{r.target?.state==="activated"&&(i.onstatechange=null,clearTimeout(o),t())}:(clearTimeout(o),n(new Error("No incoming service worker found.")))})}/**
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
 */async function Xt(e,t){if(!t&&!e.swRegistration&&await Ce(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw c.create("invalid-sw-registration");e.swRegistration=t}}/**
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
 */async function Qt(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=Ie)}/**
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
 */async function Ne(e,t){if(!navigator)throw c.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw c.create("permission-blocked");return await Qt(e,t?.vapidKey),await Xt(e,t?.serviceWorkerRegistration),jt(e)}/**
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
 */async function Zt(e,t,n){const o=en(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(o,{message_id:n[Se],message_name:n[At],message_time:n[Et],message_device_time:Math.floor(Date.now()/1e3)})}function en(e){switch(e){case k.NOTIFICATION_CLICKED:return"notification_open";case k.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
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
 */async function tn(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===k.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(X(n)):e.onMessageHandler.next(X(n)));const o=n.data;Gt(o)&&o[Ct]==="1"&&await Zt(e,n.messageType,o)}const Q="@firebase/messaging",Z="0.12.24";/**
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
 */const nn=e=>{const t=new zt(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>tn(t,n)),t},on=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:o=>Ne(t,o)}};function rn(){y(new I("messaging",nn,"PUBLIC")),y(new I("messaging-internal",on,"PRIVATE")),T(Q,Z),T(Q,Z,"esm2020")}/**
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
 */async function an(){try{await Me()}catch{return!1}return typeof window<"u"&&Pe()&&Re()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
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
 */async function sn(e){if(!navigator)throw c.create("only-available-in-window");return e.swRegistration||await Ce(e),Lt(e)}/**
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
 */function cn(e,t){if(!navigator)throw c.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}/**
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
 */function un(e=De()){return an().then(t=>{if(!t)throw c.create("unsupported-browser")},t=>{throw c.create("indexed-db-unsupported")}),R(v(e),"messaging").getImmediate()}async function ee(e,t){return e=v(e),Ne(e,t)}function dn(e){return e=v(e),sn(e)}function fn(e,t){return e=v(e),cn(e,t)}rn();let h=null,te=!1;const m=()=>{if(!te&&oe())try{const e=Fe(Ke);h=un(e),te=!0,console.log("Firebase Messaging initialisé")}catch(e){console.error("Erreur lors de l'initialisation de Firebase Messaging:",e)}return!!h};class b{static instance;currentToken=null;unsubscribeHandlers=[];constructor(){m()}static getInstance(){return b.instance||(b.instance=new b),b.instance}async requestPermissionAndGetToken(){if(!m())return console.error("Firebase Messaging non disponible"),null;try{if(!("serviceWorker"in navigator))return console.error("Service Worker non supporté"),null;const t=await navigator.serviceWorker.register("/sw.js");if(console.log("Service Worker enregistré pour FCM"),await Notification.requestPermission()!=="granted")return console.warn("Permission de notification refusée"),null;try{const o=await ee(h,{vapidKey:"BMz1kY8l6J4x7S9n2P5qR8tW3v6X9zA1C4D7E0F2G5H8I1J3K6L9M0N3O6P9Q2R5S8T1U4V7W0X3Z6A9B2C5E8F1G4H7I0J3K6L9M0N3O6P9Q2R5S8T1U4V7W0X3Z6",serviceWorkerRegistration:t});return o?(this.currentToken=o,console.log("Token FCM obtenu:",o),localStorage.setItem("fcm_token",o),await this.sendTokenToServer(o),o):(console.error("Impossible d'obtenir le token FCM"),null)}catch(o){if(o.message&&o.message.includes("applicationServerKey")){console.warn("VAPID key invalide, tentative sans VAPID key...");try{const i=await ee(h,{serviceWorkerRegistration:t});if(i)return this.currentToken=i,console.log("Token FCM obtenu sans VAPID key:",i),localStorage.setItem("fcm_token",i),await this.sendTokenToServer(i),i}catch(i){console.error("Échec même sans VAPID key:",i)}}throw o}}catch(t){return console.error("Erreur lors de l'obtention du token FCM:",t),null}}async sendTokenToServer(t){try{if(!(await fetch("/api/fcm/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t})})).ok)throw new Error("Erreur lors de l'envoi du token au serveur");console.log("Token FCM envoyé au serveur avec succès")}catch(n){console.error("Erreur lors de l'envoi du token:",n)}}onMessage(t){if(!m()){console.error("Firebase Messaging non disponible");return}const n=fn(h,o=>{console.log("Message FCM reçu en avant-plan:",o),o.notification&&this.showForegroundNotification(o),t(o)});this.unsubscribeHandlers.push(n)}showForegroundNotification(t){const n=t.notification?.title||"Notification",o={body:t.notification?.body||"",icon:t.notification?.icon||"/icons/notification-bell.png",badge:"/icons/badge.png",tag:t.tag||`foreground-${Date.now()}`,requireInteraction:!1,data:t.data||{},actions:[{action:"open",title:"Ouvrir"},{action:"dismiss",title:"Ignorer"}]};if("Notification"in window&&Notification.permission==="granted"){const i=new Notification(n,o);i.onclick=r=>{r.preventDefault(),i.close();const s=t.data?.link||"/";s!=="/"&&(window.location.href=s)},setTimeout(()=>{i.close()},5e3)}}async deleteToken(){if(!m()||!this.currentToken)return!1;try{return await dn(h),this.currentToken=null,localStorage.removeItem("fcm_token"),await fetch("/api/fcm/token",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:this.currentToken})}),console.log("Token FCM supprimé avec succès"),!0}catch(t){return console.error("Erreur lors de la suppression du token FCM:",t),!1}}getCurrentToken(){return this.currentToken||localStorage.getItem("fcm_token")}isSupported(){return"Notification"in window&&"serviceWorker"in navigator&&"PushManager"in window&&oe()}cleanup(){this.unsubscribeHandlers.forEach(t=>t()),this.unsubscribeHandlers=[]}async sendTestNotification(){if(!this.currentToken){console.error("Aucun token FCM disponible");return}try{if(!(await fetch("/api/fcm/test-notification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:this.currentToken,title:"Notification de test",body:"Ceci est une notification de test de ProjectFlow",data:{type:"test",link:"/"}})})).ok)throw new Error("Erreur lors de l'envoi de la notification de test");console.log("Notification de test envoyée avec succès")}catch(t){console.error("Erreur lors de l'envoi de la notification de test:",t)}}}export{b as FirebaseCloudMessaging,b as default};
