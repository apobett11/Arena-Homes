"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { getSupabaseClient } from "@/lib/supabase/client";
import { safeMaybeSingle, safeSelect } from "@/lib/supabase/safe";

export default function AdminSettingsPage() {
    const [tab, setTab] = useState<"brand" | "content" | "profile">("brand");
    const [message, setMessage] = useState("");

    const [siteName, setSiteName] = useState("Arena Homes");
    const [logoUrl, setLogoUrl] = useState("");
    const [tagline, setTagline] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    // New social/contact fields
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [facebookUrl, setFacebookUrl] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [twitterUrl, setTwitterUrl] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [tiktokUrl, setTiktokUrl] = useState("");
    const [telegramUrl, setTelegramUrl] = useState("");
    const [officeAddress, setOfficeAddress] = useState("");
    const [businessHours, setBusinessHours] = useState("");

    const [rules, setRules] = useState<any[]>([]);
    const [faqs, setFaqs] = useState<any[]>([]);
    const [termsBody, setTermsBody] = useState("");

    const [profile, setProfile] = useState<any>(null);
    const [profilePhone, setProfilePhone] = useState("");
    const [profileAvatar, setProfileAvatar] = useState("");

    useEffect(() => {
        const load = async () => {
            const supabase = getSupabaseClient() as any;
            const { data: authData } = await supabase.auth.getUser();
            const userId = authData?.user?.id;

            const brand = await safeMaybeSingle<any>("site_settings", (q) =>
                q.select("*").eq("id", "default").maybeSingle()
            );
            if (brand) {
                setSiteName(brand.site_name || "Arena Homes");
                setLogoUrl(brand.logo_url || "");
                setTagline(brand.tagline || "");
                setContactEmail(brand.contact_email || "");
                setContactPhone(brand.contact_phone || "");
                // New fields
                setWhatsappNumber(brand.whatsapp_number || "");
                setFacebookUrl(brand.facebook_url || "");
                setInstagramUrl(brand.instagram_url || "");
                setTwitterUrl(brand.twitter_url || "");
                setYoutubeUrl(brand.youtube_url || "");
                setTiktokUrl(brand.tiktok_url || "");
                setTelegramUrl(brand.telegram_url || "");
                setOfficeAddress(brand.office_address || "");
                setBusinessHours(brand.business_hours || "");
            } else {
                const fallbackBrand = await safeMaybeSingle<any>("app_settings", (q) =>
                    q.select("*").eq("key", "site_brand").maybeSingle()
                );
                const value = fallbackBrand?.value || {};
                setSiteName(value.site_name || "Arena Homes");
                setLogoUrl(value.logo_url || "");
                setTagline(value.tagline || "");
                setContactEmail(value.contact_email || "");
                setContactPhone(value.contact_phone || "");
            }

            const [rulesRows, faqRows, termsRows, profileRow] = await Promise.all([
                safeSelect<any>("rules", (q) => q.select("*").order("created_at", { ascending: false })),
                safeSelect<any>("faqs", (q) => q.select("*").order("created_at", { ascending: false })),
                safeSelect<any>("legal_documents", (q) => q.select("*").eq("slug", "terms-and-conditions").limit(1)),
                safeMaybeSingle<any>("profiles", (q) => q.select("*").eq("user_id", userId).maybeSingle()),
            ]);
            setRules(rulesRows);
            setFaqs(faqRows);
            setTermsBody(termsRows[0]?.body || "");
            setProfile(profileRow);
            setProfilePhone(profileRow?.phone_number || "");
            setProfileAvatar(profileRow?.avatar_url || "");
        };
        void load();
    }, []);

    const saveBrand = async () => {
        setMessage("");
        const supabase = getSupabaseClient() as any;
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || null;
        const payload = {
            id: "default",
            site_name: siteName,
            logo_url: logoUrl,
            tagline,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            // New fields
            whatsapp_number: whatsappNumber,
            facebook_url: facebookUrl,
            instagram_url: instagramUrl,
            twitter_url: twitterUrl,
            youtube_url: youtubeUrl,
            tiktok_url: tiktokUrl,
            telegram_url: telegramUrl,
            office_address: officeAddress,
            business_hours: businessHours,
            updated_by: userId,
        };
        const result = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });
        if (result.error) {
            await supabase.from("app_settings").upsert({
                key: "site_brand",
                value: {
                    site_name: siteName,
                    logo_url: logoUrl,
                    tagline,
                    contact_email: contactEmail,
                    contact_phone: contactPhone,
                },
                is_public: true,
            }, { onConflict: "key" });
        }
        setMessage("Brand settings saved.");
    };

    const addRule = async () => {
        const title = window.prompt("Rule title");
        const description = window.prompt("Rule description");
        if (!title || !description) return;
        const supabase = getSupabaseClient() as any;
        await supabase.from("rules").insert({ title, description });
        const rows = await safeSelect<any>("rules", (q) => q.select("*").order("created_at", { ascending: false }));
        setRules(rows);
    };

    const addFaq = async () => {
        const question = window.prompt("FAQ question");
        const answer = window.prompt("FAQ answer");
        if (!question || !answer) return;
        const supabase = getSupabaseClient() as any;
        await supabase.from("faqs").insert({ question, answer });
        const rows = await safeSelect<any>("faqs", (q) => q.select("*").order("created_at", { ascending: false }));
        setFaqs(rows);
    };

    const saveTerms = async () => {
        const supabase = getSupabaseClient() as any;
        const { data: authData } = await supabase.auth.getUser();
        await supabase.from("legal_documents").upsert(
            {
                slug: "terms-and-conditions",
                title: "Terms and Conditions",
                body: termsBody,
                is_published: true,
                updated_by: authData?.user?.id || null,
            },
            { onConflict: "slug" }
        );
        setMessage("Terms saved.");
    };

    const saveProfile = async () => {
        if (!profile?.user_id) return;
        const supabase = getSupabaseClient() as any;
        await supabase
            .from("profiles")
            .update({
                phone_number: profilePhone,
                avatar_url: profileAvatar || null,
            })
            .eq("user_id", profile.user_id);
        setMessage("Profile updated.");
    };

    return (
        <div className="min-h-screen pb-24 lg:pb-8">
            <AdminTopBar />
            <div className="p-4 md:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-white mb-4">System Settings</h1>
                <p className="text-slate-400">Manage brand, public content, and admin profile controls.</p>
                {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
                <div className="mt-6 flex flex-wrap gap-2">
                    {[
                        ["brand", "Brand settings"],
                        ["content", "Content settings"],
                        ["profile", "Admin profile"],
                    ].map(([id, label]) => (
                        <button
                            key={id}
                            onClick={() => setTab(id as any)}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                tab === id
                                    ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
                                    : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {tab === "brand" && (
                    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/50 p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white">Public Face / Brand Settings</h2>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Site Name</label>
                                <input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Site name" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Logo URL</label>
                                <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs text-slate-400 mb-1">Tagline</label>
                                <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Tagline" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                            </div>
                        </div>

                        <div className="border-t border-slate-800 pt-4 mt-4">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3">Contact Information</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Contact Email</label>
                                    <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Contact email" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Contact Phone</label>
                                    <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact phone" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">WhatsApp Number</label>
                                    <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="e.g., +254700000000" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Office Address</label>
                                    <input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="Office address" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs text-slate-400 mb-1">Business Hours</label>
                                    <input value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} placeholder="e.g., Mon-Fri 9AM-6PM, Sat 10AM-4PM" className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-800 pt-4 mt-4">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3">Social Media Links</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Facebook URL</label>
                                    <input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Instagram URL</label>
                                    <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Twitter URL</label>
                                    <input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/..." className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">YouTube URL</label>
                                    <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">TikTok URL</label>
                                    <input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@..." className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Telegram URL</label>
                                    <input value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} placeholder="https://t.me/..." className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                                </div>
                            </div>
                        </div>

                        <button onClick={saveBrand} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white mt-4">
                            Save brand settings
                        </button>
                    </div>
                )}
                {tab === "content" && (
                    <div className="mt-6 space-y-5">
                        <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-white">Rules</h3>
                                <button onClick={addRule} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Add rule</button>
                            </div>
                            <div className="space-y-2">
                                {rules.map((rule) => (
                                    <div key={rule.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                                        <p className="font-semibold text-white">{rule.title}</p>
                                        <p className="text-sm text-slate-300">{rule.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-white">FAQ</h3>
                                <button onClick={addFaq} className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">Add FAQ</button>
                            </div>
                            <div className="space-y-2">
                                {faqs.map((faq) => (
                                    <div key={faq.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                                        <p className="font-semibold text-white">{faq.question}</p>
                                        <p className="text-sm text-slate-300">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                            <h3 className="text-base font-semibold text-white mb-3">Terms and Conditions</h3>
                            <textarea value={termsBody} onChange={(e) => setTermsBody(e.target.value)} rows={8} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                            <button onClick={saveTerms} className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save terms</button>
                        </section>
                    </div>
                )}
                {tab === "profile" && (
                    <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/50 p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white">Admin Profile</h2>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Full name (locked)</label>
                                <input disabled value={profile?.full_name || ""} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Role (locked)</label>
                                <input disabled value={profile?.role_id || ""} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Phone number</label>
                                <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-slate-400">Avatar URL</label>
                                <input value={profileAvatar} onChange={(e) => setProfileAvatar(e.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                            </div>
                        </div>
                        <button onClick={saveProfile} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save profile</button>
                    </div>
                )}
            </div>
        </div>
    );
}
