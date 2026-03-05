import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl space-y-8">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent hover:text-primary">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </div>

                <div className="space-y-6 text-foreground">
                    <h1 className="text-5xl font-serif tracking-tight">Privacy Policy</h1>
                    <p className="text-sm text-muted-foreground">Last updated: March 5, 2026</p>

                    <div className="prose dark:prose-invert max-w-none space-y-6 text-lg leading-relaxed text-muted-foreground">

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
                            <p>
                                EldersFive ("we", "our", or "us") operates the EldersFive web application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
                            <p className="font-semibold text-foreground">Account Information</p>
                            <p>
                                When you sign in with Google, we receive your name, email address, and profile picture from your Google account. We use this information to create and manage your EldersFive account.
                            </p>
                            <p className="font-semibold text-foreground">Conversation Data</p>
                            <p>
                                Messages you send through the platform are AES encrypted before being stored. We store conversation data to provide the service and allow you to access your debate history.
                            </p>
                            <p className="font-semibold text-foreground">Usage Data</p>
                            <p>
                                We automatically collect certain information when you access the service, including your browser type, access times, and pages viewed. This data helps us improve the service.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
                            <ul className="space-y-2 list-disc list-inside">
                                <li>To provide, maintain, and improve the EldersFive service</li>
                                <li>To authenticate your identity and manage your account</li>
                                <li>To facilitate debates and conversations between users</li>
                                <li>To generate AI-powered judgments via the EldersFive system</li>
                                <li>To send service-related notifications</li>
                                <li>To detect and prevent fraud or abuse</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">4. Third-Party Services</h2>
                            <p>We use the following third-party services:</p>
                            <ul className="space-y-2 list-disc list-inside">
                                <li><strong>Google OAuth:</strong> For user authentication. Google's privacy policy applies to data collected through their sign-in service.</li>
                                <li><strong>Supabase:</strong> For database and authentication infrastructure.</li>
                                <li><strong>AI/LLM Providers:</strong> Conversation content is sent to AI language model providers to generate the EldersFive judgments. This data is processed according to their respective privacy policies.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">5. Data Security</h2>
                            <p>
                                We take the security of your data seriously. Conversations are AES encrypted before storage. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">6. Data Retention</h2>
                            <p>
                                We retain your account information and conversation data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">7. Your Rights</h2>
                            <p>You have the right to:</p>
                            <ul className="space-y-2 list-disc list-inside">
                                <li>Access the personal data we hold about you</li>
                                <li>Request correction of inaccurate data</li>
                                <li>Request deletion of your data</li>
                                <li>Withdraw consent for data processing</li>
                                <li>Request a copy of your data in a portable format</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">8. Children's Privacy</h2>
                            <p>
                                EldersFive is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected such information, we will take steps to delete it promptly.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">9. Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                            </p>
                        </section>

                        <section className="pt-4 border-t border-border space-y-3">
                            <h2 className="text-2xl font-semibold text-foreground">10. Contact Us</h2>
                            <p>
                                If you have questions about this Privacy Policy, please contact us at{" "}
                                <a
                                    href="mailto:aditya9@alumni.iitm.ac.in"
                                    className="text-primary hover:underline transition-colors"
                                >
                                    aditya9@alumni.iitm.ac.in
                                </a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
