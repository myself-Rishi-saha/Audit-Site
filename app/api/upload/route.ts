import {NextResponse} from 'next/server'
import {ensureUploadDir,fs,path} from '@/lib/service-report'
export const runtime='nodejs'
export async function POST(req:Request){const form=await req.formData();const file=form.get('file');const reportId=String(form.get('reportId')||'evidence');const type=String(form.get('type')||'photo');if(!(file instanceof File))return NextResponse.json({error:'File required'},{status:400});await ensureUploadDir(reportId);const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');const fileName=`${Date.now()}-${safe}`;await fs.writeFile(path.join(process.cwd(),'public/uploads',reportId,fileName),Buffer.from(await file.arrayBuffer()));return NextResponse.json({reportId,type,url:`/uploads/${reportId}/${fileName}`,fileName,capturedAt:new Date().toISOString()})}
