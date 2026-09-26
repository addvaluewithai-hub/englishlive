export type OttiPortraitPose = 'idle' | 'wave' | 'proud' | 'celebrate';

export function renderOttiSvg({
  pose = 'idle',
  className = '',
}: {
  pose?: OttiPortraitPose;
  className?: string;
} = {}) {
  return `
<svg
  class="otti-svg otti-pose-${pose} ${className}" 
  viewBox="0 0 360 340"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  focusable="false"
>
  <ellipse class="otti-shadow" cx="180" cy="315" rx="112" ry="14" fill="#D8D1CB" fill-opacity=".42" />

  <g class="otti-celebration-sparks" aria-hidden="true">
    <path d="M54 80l8-16 8 16-8 16-8-16Z" fill="#FFB83E"/>
    <path d="M301 71l6-13 6 13-6 13-6-13Z" fill="#FF3F68"/>
    <circle cx="320" cy="112" r="6" fill="#FFCE5C"/>
    <circle cx="40" cy="132" r="5" fill="#FF79A1"/>
  </g>

  <g class="otti-tentacles">
    <path class="otti-tentacle otti-tentacle-left-back" d="M113 246C77 251 60 233 64 210C67 193 83 182 98 189C110 194 111 209 103 214C96 218 88 214 89 207" stroke="#FF3F7A" stroke-width="31" stroke-linecap="round"/>
    <path class="otti-tentacle otti-tentacle-right-back" d="M247 246C283 251 300 233 296 210C293 193 277 182 262 189C250 194 249 209 257 214C264 218 272 214 271 207" stroke="#FF3F7A" stroke-width="31" stroke-linecap="round"/>

    <path class="otti-tentacle otti-tentacle-left" d="M126 250C91 254 84 283 104 297C120 308 142 296 143 278" stroke="#FF3F7A" stroke-width="46" stroke-linecap="round"/>
    <path class="otti-tentacle otti-tentacle-left-mid" d="M153 257C130 267 130 301 153 311C175 320 191 302 187 282" stroke="#FF3F7A" stroke-width="47" stroke-linecap="round"/>
    <path class="otti-tentacle otti-tentacle-right-mid" d="M207 257C230 267 230 301 207 311C185 320 169 302 173 282" stroke="#FF3F7A" stroke-width="47" stroke-linecap="round"/>
    <path class="otti-tentacle otti-tentacle-right" d="M234 250C269 254 276 283 256 297C240 308 218 296 217 278" stroke="#FF3F7A" stroke-width="46" stroke-linecap="round"/>
  </g>

  <g class="otti-body-group">
    <path class="otti-body-core" d="M180 37C114 37 78 82 75 143C72 195 92 234 116 254C135 270 155 277 180 277C205 277 225 270 244 254C268 234 288 195 285 143C282 82 246 37 180 37Z" fill="#FF3F7A"/>
    <path class="otti-body-highlight" d="M104 141C108 93 134 61 170 55" stroke="#FF82AA" stroke-width="9" stroke-linecap="round" opacity=".86"/>
    <ellipse cx="163" cy="54" rx="12" ry="5" fill="#FF8EB3" opacity=".8"/>
  </g>

  <g class="otti-face">
    <g class="otti-eye otti-eye-left">
      <ellipse cx="146" cy="151" rx="27" ry="36" fill="#FFFDFB"/>
      <ellipse class="otti-pupil" cx="149" cy="153" rx="13" ry="21" fill="#2F2732"/>
      <ellipse cx="145" cy="144" rx="4.8" ry="7" fill="white"/>
      <circle cx="155" cy="164" r="2.7" fill="white" opacity=".78"/>
    </g>
    <g class="otti-eye otti-eye-right">
      <ellipse cx="214" cy="151" rx="27" ry="36" fill="#FFFDFB"/>
      <ellipse class="otti-pupil" cx="211" cy="153" rx="13" ry="21" fill="#2F2732"/>
      <ellipse cx="207" cy="144" rx="4.8" ry="7" fill="white"/>
      <circle cx="217" cy="164" r="2.7" fill="white" opacity=".78"/>
    </g>

    <ellipse class="otti-cheek otti-cheek-left" cx="117" cy="184" rx="17" ry="9" fill="#FF86AA"/>
    <ellipse class="otti-cheek otti-cheek-right" cx="243" cy="184" rx="17" ry="9" fill="#FF86AA"/>

    <path data-otti-smile class="otti-smile" d="M159 202C166 215 194 215 201 202" stroke="#8F174C" stroke-width="5" stroke-linecap="round"/>
    <ellipse data-otti-mouth class="otti-mouth-open" cx="180" cy="208" rx="18" ry="7" fill="#7D163F" opacity="0"/>
  </g>

  <g class="otti-suction-cups" fill="#FF9ABC" stroke="#D9316B" stroke-width="1.7">
    <circle cx="90" cy="214" r="5"/><circle cx="97" cy="225" r="4"/><circle cx="107" cy="234" r="3.7"/>
    <circle cx="270" cy="214" r="5"/><circle cx="263" cy="225" r="4"/><circle cx="253" cy="234" r="3.7"/>
    <circle cx="129" cy="275" r="5"/><circle cx="139" cy="284" r="4"/>
    <circle cx="231" cy="275" r="5"/><circle cx="221" cy="284" r="4"/>
  </g>
</svg>`.trim();
}
