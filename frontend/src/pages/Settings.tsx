import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Store, Shield, CircleCheck, AlertCircle, Loader2, Globe, Heart } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/services/userService";
import { OnlineTrackingTab } from "@/components/settings/OnlineTrackingTab";
import { LoyaltyTab } from "@/components/settings/LoyaltyTab";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { user, updateUser } = useAuth();

  // Profile State
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  // Store State
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeData, setStoreData] = useState({
    name: user?.store_name || "",
    address: "",
    currency_code: "",
  });

  // Security State
  const [securityLoading, setSecurityLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Fetch full store info on mount
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await userService.getStore();
        const store = response.data;
        setStoreData({
          name: store.name || "",
          address: store.address || "",
          currency_code: store.currency_code || "",
        });
      } catch (error) {
        console.error("Failed to fetch store info:", error);
      }
    };
    fetchStore();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await userService.updateProfile(profileData);
      updateUser(profileData);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleStoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreLoading(true);
    try {
      await userService.updateStore(storeData);
      updateUser({ store_name: storeData.name });
      toast.success("Store info updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update store info");
    } finally {
      setStoreLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.new_password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setSecurityLoading(true);
    try {
      await userService.updatePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("Password updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally {
      setSecurityLoading(false);
    }
  };

  const inputCls = "h-11 bg-transparent border border-[#262626] rounded-[2px] px-3 font-medium text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#DA291C] transition-colors";
  const labelCls = "text-[11px] font-bold uppercase tracking-[1.5px] text-[#555555]";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 lg:pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic">System Configuration</h1>
        <div className="h-0.5 w-12 bg-[#DA291C]" />
        <p className="text-[#888888] mt-2 text-sm uppercase tracking-[0.5px]">Manage enterprise preferences and security protocols.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex w-full mb-10 bg-[#0A0A0A] border border-[#262626] p-1 rounded-[2px] h-12 overflow-x-auto hide-scrollbar space-x-1">
          <TabsTrigger value="profile" className="flex-1 flex items-center justify-center gap-2 rounded-[1px] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white text-[#555555] transition-all h-full min-w-[120px] uppercase text-[10px] font-bold tracking-[1.5px]">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="flex-1 flex items-center justify-center gap-2 rounded-[1px] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white text-[#555555] transition-all h-full min-w-[120px] uppercase text-[10px] font-bold tracking-[1.5px]">
            <Store className="h-3.5 w-3.5 shrink-0" />
            <span>Business</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 flex items-center justify-center gap-2 rounded-[1px] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white text-[#555555] transition-all h-full min-w-[120px] uppercase text-[10px] font-bold tracking-[1.5px]">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="online" className="flex-1 flex items-center justify-center gap-2 rounded-[1px] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white text-[#555555] transition-all h-full min-w-[140px] uppercase text-[10px] font-bold tracking-[1.5px]">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span>Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex-1 flex items-center justify-center gap-2 rounded-[1px] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white text-[#555555] transition-all h-full min-w-[140px] uppercase text-[10px] font-bold tracking-[1.5px]">
            <Heart className="h-3.5 w-3.5 shrink-0" />
            <span>Loyalty</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-[#0A0A0A] border border-[#262626] rounded-[2px] overflow-hidden">
            <div className="p-8 border-b border-[#262626]">
              <h3 className="text-[14px] font-bold uppercase tracking-[2px] text-white">Identity Parameters</h3>
              <p className="text-[11px] text-[#555555] uppercase tracking-[1px] mt-1">Update your administrative credentials.</p>
            </div>
            <form onSubmit={handleProfileUpdate}>
              <div className="p-8 space-y-8">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="name" className={labelCls}>Full Legal Name</Label>
                    <input
                      id="name"
                      value={profileData.name}
                      onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                      className={cn(inputCls, "w-full")}
                      placeholder="ENTER NAME"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="phone" className={labelCls}>Contact Number</Label>
                    <input
                      id="phone"
                      value={profileData.phone}
                      onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                      className={cn(inputCls, "w-full")}
                      placeholder="+977-XXXXXXXXXX"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className={labelCls}>Primary Email Address</Label>
                  <div className="relative">
                    <input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className={cn(inputCls, "w-full bg-[#111111] border-dashed cursor-not-allowed pr-10 text-[#888888]")}
                    />
                    <CircleCheck className="absolute right-3 top-3 h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-[9px] text-[#444444] uppercase tracking-[1px]">Verified accounts require support authorization for email updates.</p>
                </div>
              </div>
              <div className="bg-[#111111] border-t border-[#262626] p-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={profileLoading}
                  className="rounded-[2px] h-12 px-10 font-bold uppercase text-[11px] tracking-[2px] bg-white text-black hover:bg-[#EEEEEE] transition-all"
                >
                  {profileLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : "Update Identity"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="store" className="focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-[#0A0A0A] border border-[#262626] rounded-[2px] overflow-hidden">
            <div className="p-8 border-b border-[#262626]">
              <h3 className="text-[14px] font-bold uppercase tracking-[2px] text-white">Business Entity Info</h3>
              <p className="text-[11px] text-[#555555] uppercase tracking-[1px] mt-1">Configure your commercial workspace and regional settings.</p>
            </div>
            <form onSubmit={handleStoreUpdate}>
              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="store_name" className={labelCls}>Registered Store Name</Label>
                  <input
                    id="store_name"
                    value={storeData.name}
                    onChange={e => setStoreData({ ...storeData, name: e.target.value })}
                    className={cn(inputCls, "w-full")}
                    placeholder="ENTER STORE NAME"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="address" className={labelCls}>Physical Workspace Address</Label>
                  <input
                    id="address"
                    value={storeData.address}
                    onChange={e => setStoreData({ ...storeData, address: e.target.value })}
                    className={cn(inputCls, "w-full")}
                    placeholder="E.G. KATHMANDU, NEPAL"
                  />
                </div>
                <div className="space-y-3 w-full sm:w-1/2">
                  <Label htmlFor="currency" className={labelCls}>System Currency Protocol</Label>
                  <input
                    id="currency"
                    value={storeData.currency_code}
                    onChange={e => setStoreData({ ...storeData, currency_code: e.target.value })}
                    className={cn(inputCls, "w-full uppercase")}
                    placeholder="E.G. NPR"
                  />
                </div>
              </div>
              <div className="bg-[#111111] border-t border-[#262626] p-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={storeLoading}
                  className="rounded-[2px] h-12 px-10 font-bold uppercase text-[11px] tracking-[2px] bg-white text-black hover:bg-[#EEEEEE] transition-all"
                >
                  {storeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : "Save Business Profile"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="security" className="focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-[#0A0A0A] border border-[#262626] rounded-[2px] overflow-hidden border-l-2 border-l-[#DA291C]">
            <div className="p-8 border-b border-[#262626]">
              <h3 className="text-[14px] font-bold uppercase tracking-[2px] text-white">Security & Encryption</h3>
              <p className="text-[11px] text-[#555555] uppercase tracking-[1px] mt-1">Rotate your authentication keys regularly.</p>
            </div>
            <form onSubmit={handlePasswordUpdate}>
              <div className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="current_password" className={labelCls}>Current Passkey</Label>
                  <input
                    id="current_password"
                    type="password"
                    autoComplete="current-password"
                    value={passwordData.current_password}
                    onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className={cn(inputCls, "w-full")}
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="new_password" className={labelCls}>New Passkey</Label>
                    <input
                      id="new_password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordData.new_password}
                      onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className={cn(inputCls, "w-full")}
                      placeholder="MIN 8 CHARS"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirm_password" className={labelCls}>Verify Passkey</Label>
                    <input
                      id="confirm_password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordData.confirm_password}
                      onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className={cn(inputCls, "w-full")}
                      placeholder="RE-ENTER PASSKEY"
                    />
                  </div>
                </div>
                <div className="bg-[#111111] border border-[#262626] p-5 rounded-[2px] flex gap-4">
                  <AlertCircle className="h-5 w-5 text-[#DA291C] shrink-0" />
                  <p className="text-[10px] text-[#888888] uppercase tracking-[1px] leading-relaxed">
                    Changing your passkey will immediately invalidate current session tokens. You may be required to re-authenticate on other active nodes.
                  </p>
                </div>
              </div>
              <div className="bg-[#111111] border-t border-[#262626] p-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={securityLoading}
                  className="rounded-[2px] h-12 px-10 font-bold uppercase text-[11px] tracking-[2px] bg-[#DA291C] text-white hover:bg-[#B01E0A] transition-all"
                >
                  {securityLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : "Update Passkey"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="online" className="focus-visible:outline-none focus-visible:ring-0">
          <OnlineTrackingTab />
        </TabsContent>

        <TabsContent value="loyalty" className="focus-visible:outline-none focus-visible:ring-0">
          <LoyaltyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
