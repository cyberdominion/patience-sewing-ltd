"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  deleteProductAction,
  saveProductAction,
  toggleFeaturedAction,
  toggleProductStatusAction,
} from "@/app/admin/actions";
import { initialState } from "@/lib/action-types";
import {
  Trash2,
  Pencil,
  Archive,
  ArchiveRestore,
  Star,
  Loader2,
  Save,
  X,
  ImagePlus,
  ExternalLink,
} from "lucide-react";

type ProductData = {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  description: string;
  category: string;
  fabric?: string | null;
  colourways: string[];
  sizes: string[];
  styleCode?: string | null;
  bespoke: boolean;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty: number;
  compareAtPrice?: number | null;
  stock: number;
  lowStockAlert: number;
  leadTimeDays: number;
  images: string[];
  status: string;
  featured: boolean;
  tags: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export function ProductForm({
  product,
  categories,
}: {
  product: ProductData | null;
  categories: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(saveProductAction, initialState());
  const [colourways, setColourways] = useState<string[]>(product?.colourways.filter((c) => c !== "Any") ?? []);
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [tags, setTags] = useState<string[]>(product?.tags ?? []);
  const [colourInput, setColourInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const toastFired = useRef(false);

  useEffect(() => {
    if (state.ok && !product && state.message && !toastFired.current) {
      toastFired.current = true;
      window.dispatchEvent(
        new CustomEvent("psl:toast", {
          detail: { message: state.message, tone: "success" },
        }),
      );
    }
    if (!state.ok) {
      toastFired.current = false;
    }
  }, [state.ok, state.message, product]);

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        setUploadError(data.message ?? "Upload failed.");
        return;
      }
      setImages([...images, data.url]);
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }
  const [retail, setRetail] = useState(product?.retailPrice.toString() ?? "");
  const [wholesale, setWholesale] = useState(product?.wholesalePrice.toString() ?? "");

  const errors = state.errors ?? {};
  const margin =
    Number(retail) > 0 && Number(wholesale) > 0
      ? Math.round(((Number(retail) - Number(wholesale)) / Number(retail)) * 100)
      : 0;

  const addToken = (
    value: string,
    list: string[],
    setter: (next: string[]) => void,
    clear: () => void,
  ) => {
    const tokens = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;
    setter([...new Set([...list, ...tokens])]);
    clear();
  };

  return (
    <form action={action} className="space-y-6">
      {product && <input type="hidden" name="productId" value={product.id} />}

      {state.message && (
        <p
          role="status"
          className={`rounded-lg p-3 text-sm ${
            state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" name="name" defaultValue={product?.name} error={errors.name} required />
            <Field label="Style code" name="styleCode" defaultValue={product?.styleCode ?? ""} placeholder="PSL-IW-001" />
          </div>

          <Field label="Subtitle" name="subtitle" defaultValue={product?.subtitle ?? ""} placeholder="One line that sells it" error={errors.subtitle} />

          <div>
            <label className="label" htmlFor="description">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              required
              defaultValue={product?.description}
              className={`input resize-y ${errors.description ? "border-red-400" : ""}`}
              placeholder="What it is, who it is for, how it is made, why it is worth the price."
            />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">
                Category <span className="text-red-600">*</span>
              </label>
              <select id="category" name="category" defaultValue={product?.category ?? "DRESSES"} className="input">
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Fabric" name="fabric" defaultValue={product?.fabric ?? ""} placeholder="Silk-lace blend with hand beadwork" />
          </div>

          <TokenField
            label="Sizes"
            hint="Comma separated or type one and press Add. Leave empty only for made-to-measure."
            tokens={sizes}
            value={sizeInput}
            onChange={setSizeInput}
            onAdd={() => addToken(sizeInput, sizes, setSizes, () => setSizeInput(""))}
            onRemove={(t) => setSizes(sizes.filter((s) => s !== t))}
            error={errors.sizes}
            name="sizes"
            required
          />

          <TokenField
            label="Colourways"
            hint="Names customers will recognise, e.g. Royal Blue, Deep Wine."
            tokens={colourways}
            value={colourInput}
            onChange={setColourInput}
            onAdd={() => addToken(colourInput, colourways, setColourways, () => setColourInput(""))}
            onRemove={(t) => setColourways(colourways.filter((c) => c !== t))}
            name="colourways"
          />
        </div>

        {/* pricing + inventory */}
        <div className="space-y-4">
          <fieldset className="rounded-xl border border-royal-900/12 bg-royal-50/40 p-4">
            <legend className="px-2 font-display text-lg font-semibold text-royal-950">Pricing (naira)</legend>

            <div className="space-y-3">
              <div>
                <label className="label" htmlFor="retailPrice">
                  Retail price <span className="text-red-600">*</span>
                </label>
                <input
                  id="retailPrice"
                  name="retailPrice"
                  type="number"
                  min={1}
                  required
                  value={retail}
                  onChange={(e) => setRetail(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="wholesalePrice">
                  Wholesale price <span className="text-red-600">*</span>
                </label>
                <input
                  id="wholesalePrice"
                  name="wholesalePrice"
                  type="number"
                  min={1}
                  required
                  value={wholesale}
                  onChange={(e) => setWholesale(e.target.value)}
                  className={`input ${errors.wholesalePrice ? "border-red-400" : ""}`}
                />
                {errors.wholesalePrice && (
                  <p className="mt-1 text-xs text-red-600">{errors.wholesalePrice}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="compareAtPrice">
                  Compare-at price
                </label>
                <input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  type="number"
                  min={0}
                  defaultValue={product?.compareAtPrice ?? ""}
                  placeholder="Show as discounted"
                  className="input"
                />
              </div>

              <div>
                <label className="label" htmlFor="wholesaleMinQty">
                  Wholesale minimum quantity
                </label>
                <input
                  id="wholesaleMinQty"
                  name="wholesaleMinQty"
                  type="number"
                  min={1}
                  defaultValue={product?.wholesaleMinQty ?? 6}
                  className="input"
                />
              </div>

              {margin > 0 && (
                <p className="rounded-lg bg-white p-3 text-xs text-royal-900/70">
                  Retailers see <span className="font-semibold">{margin}% off retail</span>, so you
                  keep {margin}% on every wholesale unit sold.
                </p>
              )}
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-royal-900/12 bg-royal-50/40 p-4">
            <legend className="px-2 font-display text-lg font-semibold text-royal-950">
              Inventory
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="stock">
                  Stock
                </label>
                <input id="stock" name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="lowStockAlert">
                  Low at
                </label>
                <input
                  id="lowStockAlert"
                  name="lowStockAlert"
                  type="number"
                  min={0}
                  defaultValue={product?.lowStockAlert ?? 5}
                  className="input"
                />
              </div>
              <div className="col-span-2">
                <label className="label" htmlFor="leadTimeDays">
                  Lead time (days)
                </label>
                <input
                  id="leadTimeDays"
                  name="leadTimeDays"
                  type="number"
                  min={1}
                  defaultValue={product?.leadTimeDays ?? 14}
                  className="input"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-royal-900/12 bg-royal-50/40 p-4">
            <legend className="px-2 font-display text-lg font-semibold text-royal-950">
              Visibility
            </legend>
            <div className="space-y-3">
              <div>
                <label className="label" htmlFor="status">
                  Status
                </label>
                <select id="status" name="status" defaultValue={product?.status ?? "DRAFT"} className="input">
                  <option value="DRAFT">Draft, hidden from the shop</option>
                  <option value="ACTIVE">Active, visible to customers</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-royal-900/80">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={product?.featured ?? false}
                  className="h-4 w-4 accent-royal-900"
                />
                Feature on the homepage
              </label>
              <label className="flex items-center gap-2 text-sm text-royal-900/80">
                <input
                  type="checkbox"
                  name="bespoke"
                  defaultChecked={product?.bespoke ?? false}
                  className="h-4 w-4 accent-royal-900"
                />
                Available made to measure
              </label>
            </div>
          </fieldset>
        </div>
      </div>

      {/* images */}
      <section className="rounded-xl border border-royal-900/12 p-4">
        <p className="label">Images</p>
        <p className="mb-3 text-xs text-royal-900/50">
          Upload a file or paste an image URL. The first image is the one shown in listings.
          Landscape images work best at 1200px wide, under 5&nbsp;MB.
        </p>

        {images.length > 0 && (
          <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((url, i) => (
              <li key={url + i} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="aspect-3/4 w-full rounded-lg border border-royal-900/10 object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-gold-500 px-2 py-0.5 text-[0.6rem] font-bold text-royal-950">
                    Main
                  </span>
                )}
                <div className="absolute inset-x-2 bottom-2 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i - 1))}
                    disabled={i === 0}
                    className="rounded bg-white/90 p-1 text-royal-900 disabled:opacity-30"
                    aria-label="Move image earlier"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i + 1))}
                    disabled={i === images.length - 1}
                    className="rounded bg-white/90 p-1 text-royal-900 disabled:opacity-30"
                    aria-label="Move image later"
                  >
                    <ImagePlus className="h-3.5 w-3.5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="rounded bg-red-600/90 p-1 text-white"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input type="hidden" name="images" value={url} />
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`btn btn-outline cursor-pointer !px-4 ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? "Uploading" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={uploading}
              onChange={uploadFile}
            />
          </label>

          <input
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (imageInput.trim()) {
                  setImages([...images, imageInput.trim()]);
                  setImageInput("");
                }
              }
            }}
            placeholder="https://... or /uploads/filename.jpg"
            className="input min-w-48 flex-1"
            aria-label="Image URL"
          />
          <button
            type="button"
            onClick={() => {
              if (imageInput.trim()) {
                setImages([...images, imageInput.trim()]);
                setImageInput("");
              }
            }}
            className="btn btn-outline !px-4"
          >
            Add
          </button>
        </div>

        {uploadError && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {uploadError}
          </p>
        )}
      </section>

      <TokenField
        label="Tags"
        hint="Lower case. Used for search and merchandising."
        tokens={tags}
        value={tagInput}
        onChange={setTagInput}
        onAdd={() => addToken(tagInput, tags, setTags, () => setTagInput(""))}
        onRemove={(t) => setTags(tags.filter((x) => x !== t))}
        name="tags"
      />

      <section className="rounded-xl border border-royal-900/12 p-4">
        <p className="label">Search engine listing</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="SEO title" name="seoTitle" defaultValue={product?.seoTitle ?? ""} placeholder="Defaults to the product name" error={errors.seoTitle} />
          <Field label="SEO description" name="seoDescription" defaultValue={product?.seoDescription ?? ""} placeholder="Around 155 characters" error={errors.seoDescription} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "Saving" : product ? "Save changes" : "Create product"}
        </button>
        {product && (
          <a href={`/shop/${product.slug}`} target="_blank" className="btn btn-outline">
            View on storefront
          </a>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  error,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        className={`input ${error ? "border-red-400" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TokenField({
  label,
  hint,
  tokens,
  value,
  onChange,
  onAdd,
  onRemove,
  name,
  error,
  required,
}: {
  label: string;
  hint?: string;
  tokens: string[];
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (token: string) => void;
  name: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <span className="label">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {tokens.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {tokens.map((token) => (
            <li key={token}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-royal-100 py-1 pl-3 pr-1.5 text-xs text-royal-900">
                {token}
                <button
                  type="button"
                  onClick={() => onRemove(token)}
                  className="rounded-full p-0.5 hover:bg-royal-900/15"
                  aria-label={`Remove ${token}`}
                >
                  <X className="h-3 w-3" />
                </button>
                <input type="hidden" name={name} value={token} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              onAdd();
            }
          }}
          className={`input ${error ? "border-red-400" : ""}`}
          placeholder={hint}
        />
        <button type="button" onClick={onAdd} className="btn btn-outline !px-4">
          Add
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ProductRowActions({
  productId,
  slug,
  name,
  status,
  featured,
  stock,
  updatedAt,
}: {
  productId: string;
  slug: string;
  name: string;
  status: string;
  featured: boolean;
  stock: number;
  updatedAt: string;
}) {
  const [confirming, setConfirming] = useState<"archive" | "delete" | null>(null);

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <a
          href={`/shop/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-2 text-royal-900/60 transition-colors hover:bg-royal-50 hover:text-royal-900"
          aria-label={`View ${name} in the shop`}
          title="View in shop"
        >
          <ExternalLink className="h-4 w-4" />
        </a>

        <a
          href={`/admin/products?edit=${productId}#edit`}
          className="rounded-lg p-2 text-royal-900/60 transition-colors hover:bg-royal-50 hover:text-royal-900"
          aria-label={`Edit ${name}`}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </a>

        <form action={toggleFeaturedAction}>
          <input type="hidden" name="productId" value={productId} />
          <button
            type="submit"
            className={`rounded-lg p-2 transition-colors hover:bg-royal-50 ${
              featured ? "text-gold-600" : "text-royal-900/40"
            }`}
            aria-label={featured ? `Unfeature ${name}` : `Feature ${name}`}
            title={featured ? "Remove from homepage" : "Feature on homepage"}
          >
            <Star className={`h-4 w-4 ${featured ? "fill-gold-500" : ""}`} />
          </button>
        </form>

        {status !== "ACTIVE" ? (
          <form action={toggleProductStatusAction}>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="status" value="ACTIVE" />
            <button
              type="submit"
              className="rounded-lg p-2 text-emerald-700 transition-colors hover:bg-emerald-50"
              aria-label={`Publish ${name}`}
              title="Publish"
            >
              <ArchiveRestore className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming("archive")}
            className="rounded-lg p-2 text-royal-900/60 transition-colors hover:bg-amber-50 hover:text-amber-700"
            aria-label={`Archive ${name}`}
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setConfirming("delete")}
          className="rounded-lg p-2 text-royal-900/50 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${name}`}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4"
        >
          <div className="w-full max-w-sm rounded-card bg-white p-6 shadow-2xl">
            <h3 className="font-display text-xl font-semibold text-royal-950">
              {confirming === "delete" ? "Delete this product?" : "Archive this product?"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-royal-900/70">
              {confirming === "delete" ? (
                <>
                  <span className="font-semibold">{name}</span> will be removed from the shop.
                  Past orders keep their record of it, but the product cannot be restored. Last
                  updated {updatedAt}.
                </>
              ) : (
                <>
                  <span className="font-semibold">{name}</span> will be hidden from the shop but
                  kept in your records. You can publish it again at any time. Current stock: {stock}.
                </>
              )}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <form action={deleteProductAction}>
                <input type="hidden" name="productId" value={productId} />
                <input type="hidden" name="mode" value={confirming} />
                <button
                  type="submit"
                  className={confirming === "delete" ? "btn bg-red-600 text-white" : "btn btn-primary"}
                >
                  {confirming === "delete" ? "Delete permanently" : "Archive"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
