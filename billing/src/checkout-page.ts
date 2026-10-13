/**
 * THE HOSTED CHECKOUT PAGE — what the apps open in a WebView and what the
 * website can open in a new tab. In Razorpay mode it loads Razorpay's
 * Standard Checkout for the subscription; in sandbox mode it shows two
 * buttons that simulate the gateway's outcome. Either way the page posts the
 * result back to the app (window.ReactNativeWebView.postMessage) and also
 * verifies it with this Worker, so the app only ever has to re-read its
 * entitlement.
 *
 * The page is addressed by a short-lived HMAC token bound to one
 * subscription and one account; the Firebase token never appears in a URL.
 */
import { formatInr } from "./catalog";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface CheckoutPageModel {
  mode: "razorpay" | "sandbox";
  keyId: string;
  subscriptionId: string;
  token: string;
  productName: string;
  planLabel: string;
  amountPaise: number;
  renews: string;
  email: string;
  taxText: string;
  apiBase: string;
}

export function renderCheckoutPage(m: CheckoutPageModel): string {
  const amount = formatInr(m.amountPaise);
  const sandbox = m.mode === "sandbox";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>GaitAI — Secure checkout</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Georama:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--navy:#0b1d3a;--graphite:#2b2f36;--paper:#f7f4ee;--gold:#b8933f;--line:#e4dfd3;--muted:#5a6270}
*{box-sizing:border-box}body{margin:0;font-family:Georama,system-ui,sans-serif;background:var(--paper);color:var(--navy);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;max-width:420px;width:100%;padding:28px}
.eyebrow{font-size:11px;letter-spacing:.17em;color:var(--gold);font-weight:600;margin:0 0 14px}
h1{font-size:24px;font-weight:500;letter-spacing:-.02em;margin:0 0 6px}
.sub{color:var(--muted);font-size:14px;margin:0 0 20px}
dl{display:grid;grid-template-columns:1fr auto;gap:10px 16px;font-size:14px;margin:0 0 18px}dt{color:var(--muted)}dd{margin:0;text-align:right;font-weight:500}
.amount{font-size:30px;font-weight:500;letter-spacing:-.02em;margin:0 0 4px}
.fine{font-size:12px;color:var(--muted);line-height:1.6;margin:14px 0 0}
button{width:100%;border:0;border-radius:8px;padding:14px 16px;font:inherit;font-size:15px;font-weight:600;cursor:pointer;margin-top:10px}
.primary{background:var(--navy);color:#fffaf0}.secondary{background:transparent;border:1px solid var(--line);color:var(--navy)}
.badge{display:inline-block;border:1px solid var(--line);border-radius:30px;padding:5px 10px;font-size:11px;color:var(--gold);letter-spacing:.06em;margin-bottom:14px}
#status{font-size:14px;margin-top:14px;min-height:20px}
.sandbox{background:#fff8e6;border:1px dashed var(--gold);border-radius:8px;padding:10px 12px;font-size:12px;color:var(--graphite);margin-bottom:12px}
</style></head><body>
<main class="card">
<p class="eyebrow">GAITAI SECURE CHECKOUT</p>
${sandbox ? `<div class="sandbox"><strong>Sandbox.</strong> No money moves here. These buttons simulate what the payment gateway would report.</div>` : `<span class="badge">PAYMENTS BY RAZORPAY</span>`}
<h1>${esc(m.productName)}</h1>
<p class="sub">${esc(m.planLabel)} subscription · renews ${esc(m.renews)}</p>
<p class="amount">${esc(amount)}</p>
<dl><dt>Account</dt><dd>${esc(m.email)}</dd><dt>Billing</dt><dd>Recurring, ${esc(m.renews)}</dd><dt>Cancel</dt><dd>Any time, from Manage subscription</dd></dl>
<p class="fine">${esc(m.taxText)} By continuing you authorise recurring charges of ${esc(amount)} ${esc(m.renews)} until you cancel. Access continues to the end of the paid period after cancellation.</p>
${
  sandbox
    ? `<button class="primary" id="ok">Simulate successful payment</button><button class="secondary" id="fail">Simulate failed payment</button>`
    : `<button class="primary" id="pay">Pay ${esc(amount)} securely</button>`
}
<button class="secondary" id="cancel">Cancel</button>
<p id="status" role="status"></p>
</main>
${sandbox ? "" : `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`}
<script>
(function(){
  var API=${JSON.stringify(m.apiBase)}, TOKEN=${JSON.stringify(m.token)}, SUB=${JSON.stringify(m.subscriptionId)};
  var status=document.getElementById('status');
  function post(msg){ try{ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } }catch(e){} try{ if(window.opener){ window.opener.postMessage(msg,'*'); } }catch(e){} }
  function verify(result){
    status.textContent='Verifying payment…';
    return fetch(API+'/v1/checkout/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({checkout_token:TOKEN,razorpay_payment_id:result.razorpay_payment_id,razorpay_subscription_id:result.razorpay_subscription_id,razorpay_signature:result.razorpay_signature})})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,body:j};});})
      .then(function(x){ if(x.ok){ status.textContent='Payment verified. You can return to the app.'; post({type:'gaitai-checkout',status:'verified',subscription_id:SUB}); } else { status.textContent='Verification failed: '+(x.body&&x.body.message||x.body&&x.body.error||'unknown'); post({type:'gaitai-checkout',status:'failed',reason:x.body&&x.body.error}); } })
      .catch(function(){ status.textContent='Could not reach GaitAI to verify. Your payment, if taken, will still be recorded by the gateway.'; post({type:'gaitai-checkout',status:'unverified'}); });
  }
  document.getElementById('cancel').onclick=function(){ post({type:'gaitai-checkout',status:'cancelled'}); status.textContent='Checkout cancelled.'; };
  ${
    sandbox
      ? `document.getElementById('ok').onclick=function(){ status.textContent='Simulating…'; fetch(API+'/v1/sandbox/pay',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({checkout_token:TOKEN,outcome:'success'})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.razorpay_payment_id){ verify(j); } else { status.textContent='Sandbox refused: '+(j&&j.error); } }); };
  document.getElementById('fail').onclick=function(){ status.textContent='Simulating…'; fetch(API+'/v1/sandbox/pay',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({checkout_token:TOKEN,outcome:'failure'})}).then(function(r){return r.json();}).then(function(j){ status.textContent='Payment failed (simulated). No subscription was started.'; post({type:'gaitai-checkout',status:'failed',reason:'payment_failed'}); }); };`
      : `document.getElementById('pay').onclick=function(){
    var rzp=new Razorpay({key:${JSON.stringify(m.keyId)},subscription_id:SUB,name:'GaitAI',description:${JSON.stringify(`${m.productName} — ${m.planLabel}`)},prefill:{email:${JSON.stringify(m.email)}},theme:{color:'#0b1d3a'},
      handler:function(result){ verify(result); },
      modal:{ondismiss:function(){ post({type:'gaitai-checkout',status:'dismissed'}); status.textContent='Checkout closed.'; }}});
    rzp.on('payment.failed',function(resp){ status.textContent='Payment failed: '+(resp&&resp.error&&resp.error.description||''); post({type:'gaitai-checkout',status:'failed',reason:'payment_failed'}); });
    rzp.open(); };`
  }
})();
</script></body></html>`;
}
