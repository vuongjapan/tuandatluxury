import{l as f,c as k}from"./index-CE_6BUcf.js";import{b as $,j as l,P as m}from"./vendor-ui-CBa28K4d.js";import{r as u}from"./vendor-react-BBkshkJ7.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=f("Award",[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=f("Building2",[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]]);var d="Progress",p=100,[I,O]=$(d),[w,j]=I(d),g=u.forwardRef((e,r)=>{const{__scopeProgress:n,value:t=null,max:a,getValueLabel:N=A,...b}=e;(a||a===0)&&!c(a)&&console.error(E(`${a}`,"Progress"));const o=c(a)?a:p;t!==null&&!v(t,o)&&console.error(R(`${t}`,"Progress"));const s=v(t,o)?t:null,M=i(s)?N(s,o):void 0;return l.jsx(w,{scope:n,value:s,max:o,children:l.jsx(m.div,{"aria-valuemax":o,"aria-valuemin":0,"aria-valuenow":i(s)?s:void 0,"aria-valuetext":M,role:"progressbar","data-state":P(s,o),"data-value":s??void 0,"data-max":o,...b,ref:r})})});g.displayName=d;var x="ProgressIndicator",h=u.forwardRef((e,r)=>{const{__scopeProgress:n,...t}=e,a=j(x,n);return l.jsx(m.div,{"data-state":P(a.value,a.max),"data-value":a.value??void 0,"data-max":a.max,...t,ref:r})});h.displayName=x;function A(e,r){return`${Math.round(e/r*100)}%`}function P(e,r){return e==null?"indeterminate":e===r?"complete":"loading"}function i(e){return typeof e=="number"}function c(e){return i(e)&&!isNaN(e)&&e>0}function v(e,r){return i(e)&&!isNaN(e)&&e<=r&&e>=0}function E(e,r){return`Invalid prop \`max\` of value \`${e}\` supplied to \`${r}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${p}\`.`}function R(e,r){return`Invalid prop \`value\` of value \`${e}\` supplied to \`${r}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${p} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`}var y=g,V=h;const _=u.forwardRef(({className:e,value:r,...n},t)=>l.jsx(y,{ref:t,className:k("relative h-4 w-full overflow-hidden rounded-full bg-secondary",e),...n,children:l.jsx(V,{className:"h-full w-full flex-1 bg-primary transition-all",style:{transform:`translateX(-${100-(r||0)}%)`}})}));_.displayName=y.displayName;export{D as A,B,_ as P};
