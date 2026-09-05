// Rare Vault Drop Hits API — Cloudflare Worker + R2
// Bind an R2 bucket as HITS_BUCKET and set ADMIN_KEY as a Worker secret.

const ALLOWED_ORIGINS = new Set([
  'https://rarevaultdrop.com',
  'https://www.rarevaultdrop.com'
]);

function cors(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : 'https://rarevaultdrop.com';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Vary': 'Origin'
  };
}

function json(data, status=200, request) {
  return new Response(JSON.stringify(data), { status, headers:{'Content-Type':'application/json', ...cors(request)} });
}

function clean(value, max=100) {
  return String(value || '').trim().replace(/[<>]/g,'').slice(0,max);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors(request)});

    if (request.method === 'POST' && url.pathname === '/api/hits') {
      const form = await request.formData();
      const photo = form.get('photo');
      const hitType = clean(form.get('hitType'),40);
      const machineId = clean(form.get('machineId'),20).toUpperCase();
      const displayName = clean(form.get('displayName'),50);
      const caption = clean(form.get('caption'),180);
      const allowedTypes = new Set(['Big Hit','Vault Drop','Chase Slab Drop']);
      if (!allowedTypes.has(hitType)) return json({success:false,message:'Choose a valid hit type.'},400,request);
      if (!/^RVD-[A-Z0-9]{3,8}$/.test(machineId)) return json({success:false,message:'Enter a valid Machine ID such as RVD-001.'},400,request);
      if (!(photo instanceof File)) return json({success:false,message:'Photo is required.'},400,request);
      if (!['image/jpeg','image/png','image/webp'].includes(photo.type)) return json({success:false,message:'Photo must be JPG, PNG, or WebP.'},400,request);
      if (photo.size > 8 * 1024 * 1024) return json({success:false,message:'Photo must be 8 MB or smaller.'},413,request);

      const ext = photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg';
      const id = crypto.randomUUID();
      const key = `hits/${Date.now()}-${id}.${ext}`;
      await env.HITS_BUCKET.put(key, photo.stream(), {
        httpMetadata:{contentType:photo.type,cacheControl:'public, max-age=31536000, immutable'},
        customMetadata:{ id, hitType, machineId, displayName, caption, status:'pending', submittedAt:new Date().toISOString() }
      });
      return json({success:true,message:'Submitted for approval.'},201,request);
    }

    if (request.method === 'GET' && url.pathname === '/api/hits') {
      const listed = await env.HITS_BUCKET.list({prefix:'hits/',limit:100,include:['customMetadata']});
      const hits = listed.objects
        .filter(o => o.customMetadata?.status === 'approved')
        .sort((a,b) => (b.uploaded?.getTime?.()||0)-(a.uploaded?.getTime?.()||0))
        .map(o => ({
          id:o.customMetadata.id,
          hitType:o.customMetadata.hitType,
          machineId:o.customMetadata.machineId,
          displayName:o.customMetadata.displayName,
          caption:o.customMetadata.caption,
          submittedAt:o.customMetadata.submittedAt,
          imageUrl:`${url.origin}/media/${encodeURIComponent(o.key)}`
        }));
      return json({hits},200,request);
    }

    if (request.method === 'GET' && url.pathname.startsWith('/media/')) {
      const key = decodeURIComponent(url.pathname.slice('/media/'.length));
      if (!key.startsWith('hits/')) return new Response('Not found',{status:404});
      const object = await env.HITS_BUCKET.get(key);
      if (!object) return new Response('Not found',{status:404});
      const headers = new Headers(cors(request));
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      return new Response(object.body,{headers});
    }

    // Admin approval endpoint. Example: PATCH /api/admin/hits/<encoded-key> with Authorization: Bearer <ADMIN_KEY>
    if (request.method === 'PATCH' && url.pathname.startsWith('/api/admin/hits/')) {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.ADMIN_KEY}`) return json({success:false,message:'Unauthorized'},401,request);
      const key = decodeURIComponent(url.pathname.slice('/api/admin/hits/'.length));
      const body = await request.json().catch(()=>({}));
      const status = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : null;
      if (!status) return json({success:false,message:'Status must be approved or rejected.'},400,request);
      const object = await env.HITS_BUCKET.get(key);
      if (!object) return json({success:false,message:'Hit not found.'},404,request);
      const metadata = {...object.customMetadata,status};
      await env.HITS_BUCKET.put(key, object.body, {httpMetadata:object.httpMetadata,customMetadata:metadata});
      return json({success:true,status},200,request);
    }

    // Admin queue listing
    if (request.method === 'GET' && url.pathname === '/api/admin/hits') {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.ADMIN_KEY}`) return json({success:false,message:'Unauthorized'},401,request);
      const listed = await env.HITS_BUCKET.list({prefix:'hits/',limit:100,include:['customMetadata']});
      const hits = listed.objects.map(o => ({key:o.key,size:o.size,...o.customMetadata,imageUrl:`${url.origin}/media/${encodeURIComponent(o.key)}`}));
      return json({hits},200,request);
    }

    return json({success:false,message:'Not found'},404,request);
  }
};