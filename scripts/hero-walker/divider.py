import numpy as np
from PIL import Image
R=r"C:/Users/Anubha/Documents/website/GaitAI-main/GaitAI/public/images/hero/"
for name,guess in [("home-hero-gaitai.webp",lambda y:1377-0.331*y),("home-hero-dark.webp",lambda y:1428-0.341*y)]:
    a=np.array(Image.open(R+name).convert("L")).astype(float); H,W=a.shape
    pts=[]
    for y in range(0,H,20):
        row=a[y]; ridge=row-0.5*(np.roll(row,4)+np.roll(row,-4))
        lo,hi=(int(guess(y))-40,int(guess(y))+40) if guess else (900,1600)
        seg=ridge[lo:hi]; x=lo+int(np.argmax(seg)); pts.append((y,x,seg.max()))
    pts=np.array(pts); good=pts[pts[:,2]>25]
    # robust line fit
    for it in range(3):
        m,b=np.polyfit(good[:,0],good[:,1],1); r=np.abs(good[:,1]-(m*good[:,0]+b)); good=good[r<6]
    print(name,W,H,"x = %.2f + %.4f*y"%(b,m),"n",len(good), "x@0 %.1f x@H %.1f"%(b,b+m*H))
