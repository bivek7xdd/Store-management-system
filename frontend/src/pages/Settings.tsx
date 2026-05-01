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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-lg">Manage your account and store preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex w-full mb-8 bg-muted/50 p-1 rounded-xl h-14 overflow-x-auto hide-scrollbar space-x-1">
          <TabsTrigger value="profile" className="flex-1 flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all h-full min-w-[120px]">
            <User className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
            <span className="font-medium text-sm lg:text-base">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="flex-1 flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all h-full min-w-[120px]">
            <Store className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
            <span className="font-medium text-sm lg:text-base">Store Info</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all h-full min-w-[120px]">
            <Shield className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
            <span className="font-medium text-sm lg:text-base">Security</span>
          </TabsTrigger>
          <TabsTrigger value="online" className="flex-1 flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all h-full min-w-[140px]">
            <Globe className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
            <span className="font-medium text-sm lg:text-base">Online Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex-1 flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all h-full min-w-[140px]">
            <Heart className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
            <span className="font-medium text-sm lg:text-base">Loyalty Program</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6">
              <CardTitle className="text-xl">Profile Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-6 pt-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                    <Input 
                      id="name" 
                      value={profileData.name} 
                      onChange={e => setProfileData({...profileData, name: e.target.value})} 
                      className="rounded-xl h-11 focus-visible:ring-primary"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={profileData.phone} 
                      onChange={e => setProfileData({...profileData, phone: e.target.value})} 
                      className="rounded-xl h-11 focus-visible:ring-primary"
                      placeholder="+977-XXXXXXXXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                  <div className="relative">
                    <Input 
                      id="email" 
                      value={user?.email} 
                      disabled 
                      className="rounded-xl h-11 bg-muted/50 border-dashed cursor-not-allowed pr-10" 
                    />
                    <CircleCheck className="absolute right-3 top-3 h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-1">Verified email cannot be changed. Contact support for assistance.</p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t mt-4 py-4 px-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={profileLoading} 
                  className="rounded-xl h-11 px-8 font-semibold shadow-md active:scale-95 transition-transform"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="store" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6">
              <CardTitle className="text-xl">Store Details</CardTitle>
              <CardDescription>Manage your business information and branding.</CardDescription>
            </CardHeader>
            <form onSubmit={handleStoreUpdate}>
              <CardContent className="space-y-6 pt-8">
                <div className="space-y-2">
                  <Label htmlFor="store_name" className="text-sm font-semibold">Store Name</Label>
                  <Input 
                    id="store_name" 
                    value={storeData.name} 
                    onChange={e => setStoreData({...storeData, name: e.target.value})} 
                    className="rounded-xl h-11 focus-visible:ring-primary"
                    placeholder="Enter store name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold">Location / Address</Label>
                  <Input 
                    id="address" 
                    value={storeData.address} 
                    onChange={e => setStoreData({...storeData, address: e.target.value})} 
                    className="rounded-xl h-11 focus-visible:ring-primary"
                    placeholder="e.g. Kathmandu, Nepal"
                  />
                </div>
                <div className="space-y-2 w-full sm:w-1/2">
                  <Label htmlFor="currency" className="text-sm font-semibold">Default Currency</Label>
                  <Input 
                    id="currency" 
                    value={storeData.currency_code} 
                    onChange={e => setStoreData({...storeData, currency_code: e.target.value})} 
                    className="rounded-xl h-11 focus-visible:ring-primary"
                    placeholder="e.g. NPR, USD"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t mt-4 py-4 px-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={storeLoading}
                  className="rounded-xl h-11 px-8 font-semibold shadow-md active:scale-95 transition-transform"
                >
                  {storeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : "Update Store"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden border-l-4 border-l-amber-400">
            <CardHeader className="bg-muted/30 pb-6">
              <CardTitle className="text-xl">Security & Password</CardTitle>
              <CardDescription>Secure your account by changing your password regularly.</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordUpdate}>
              <CardContent className="space-y-6 pt-8">
                <div className="space-y-2">
                  <Label htmlFor="current_password" id="current_password_label" className="text-sm font-semibold">Current Password</Label>
                  <Input 
                    id="current_password" 
                    type="password" 
                    autoComplete="current-password"
                    value={passwordData.current_password}
                    onChange={e => setPasswordData({...passwordData, current_password: e.target.value})}
                    className="rounded-xl h-11 focus-visible:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new_password" id="new_password_label" className="text-sm font-semibold">New Password</Label>
                    <Input 
                      id="new_password" 
                      type="password"
                      autoComplete="new-password"
                      value={passwordData.new_password}
                      onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                      className="rounded-xl h-11 focus-visible:ring-primary"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" id="confirm_password_label" className="text-sm font-semibold">Confirm New Password</Label>
                    <Input 
                      id="confirm_password" 
                      type="password"
                      autoComplete="new-password"
                      value={passwordData.confirm_password}
                      onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                      className="rounded-xl h-11 focus-visible:ring-primary"
                      placeholder="Verify new password"
                    />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Changing your password will NOT sign you out of other devices. If you suspect your account is compromised, please contact support immediately.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t mt-4 py-4 px-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={securityLoading}
                  className="rounded-xl h-11 px-8 font-semibold bg-amber-600 hover:bg-amber-700 shadow-md active:scale-95 transition-transform"
                >
                  {securityLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : "Update Password"}
                </Button>
              </CardFooter>
            </form>
          </Card>
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
