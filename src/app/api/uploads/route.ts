import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { storeImage, MAX_UPLOAD_BYTES } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/** Admin-only image upload. Returns the URL to store on ProductImage.url. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Not authorised" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: "Expected a multipart upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file was included." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { message: `Images must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    );
  }

  try {
    const stored = await storeImage(file);
    return NextResponse.json(stored, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}