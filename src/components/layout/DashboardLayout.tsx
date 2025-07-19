import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useData } from "../../context/data-context-utils";
import type { Notification } from "../../types/index";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { SidebarDisposableIncomeCard } from "../dashboard/SidebarDisposableIncomeCard";

import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  ChevronDown,
  GalleryVerticalEndIcon,
  HelpCircle,
  Home,
  ListChecks,
  LogOut,
  MailOpen,
  Menu,
  User,
  X,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdminDashboard?: boolean; // New prop to differentiate admin dashboard
}

function DashboardLayout({
  children,
  isAdminDashboard = false,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isBudgetExpanded, setIsBudgetExpanded] = useState(true);
  const navigate = useNavigate();
  const isMounted = useRef(false);
  const initialLoadComplete = useRef(false); // New ref for initial load

  const data = useData();
  const {
    user = null,
    profile = null,
    loading = true,
    supabase,
    incomes = [],
    credits = [],
    recurringCharges = [],
    savingsContributions = [],
  } = data || {};

  useEffect(() => {
    if (!loading && user && profile) {
      initialLoadComplete.current = true;
    }
  }, [loading, user, profile]);

  // Presence tracking
  useEffect(() => {
    if (!supabase || !user || !profile) return;

    const presenceChannel = supabase.channel("global-presence", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        console.log(
          "[Presence - DashboardLayout] User ID:",
          user.id,
          "Profile:",
          profile
        );
        await presenceChannel.track({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
        });
      }
    });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user, profile, supabase]);

  const totalMonthlyIncome = useMemo(() => {
    return (
      incomes
        ?.filter((i) => i.frequency === "Mensuel")
        .reduce((sum, i) => sum + i.amount, 0) ?? 0
    );
  }, [incomes]);

  const totalMonthlyCreditsPayment = useMemo(() => {
    return (
      credits
        ?.filter((c) => !c.is_settled_early)
        .reduce((sum, c) => sum + c.monthly_payment, 0) ?? 0
    );
  }, [credits]);

  const totalMonthlyRecurringCharges = useMemo(() => {
    let total = 0;
    recurringCharges?.forEach((charge) => {
      let monthlyAmount = 0;
      const amountToConsider = charge.amount;
      switch (charge.frequency) {
        case "monthly":
          monthlyAmount = amountToConsider;
          break;
        case "quarterly":
          monthlyAmount = amountToConsider / 3;
          break;
        case "annually":
          monthlyAmount = amountToConsider / 12;
          break;
        default:
          break;
      }
      total += monthlyAmount;
    });
    return total;
  }, [recurringCharges]);

  const totalMonthlyContributions = useMemo(() => {
    let total = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Array.isArray(savingsContributions)) {
      savingsContributions.forEach((contribution) => {
        let monthlyAmount = 0;
        const amountToConsider = contribution.amount;
        const startDate = new Date(contribution.start_date);
        startDate.setHours(0, 0, 0, 0);

        if (isNaN(startDate.getTime()) || startDate > today) {
          return; // Skip invalid dates or future contributions
        }

        switch (contribution.frequency) {
          case "Mensuel":
            monthlyAmount = amountToConsider;
            break;
          case "Trimestriel":
            monthlyAmount = amountToConsider / 3;
            break;
          case "Annuel":
            monthlyAmount = amountToConsider / 12;
            break;
          default:
            break;
        }
        total += monthlyAmount;
      });
    }
    return total;
  }, [savingsContributions]);

  const estimatedDisposableIncome = useMemo(() => {
    return (
      totalMonthlyIncome -
      totalMonthlyCreditsPayment -
      totalMonthlyRecurringCharges -
      totalMonthlyContributions
    );
  }, [
    totalMonthlyIncome,
    totalMonthlyCreditsPayment,
    totalMonthlyRecurringCharges,
    totalMonthlyContributions,
  ]);

  useEffect(() => {
    if (!supabase) return;

    isMounted.current = true;

    const fetchNotifications = async (userId: string) => {
      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Erreur lors du chargement des notifications.");
        return;
      }

      setNotifications(notificationsData || []);
      const unreadCount = notificationsData.filter(
        (notif) => !notif.is_read
      ).length;
      setUnreadNotificationsCount(unreadCount);
      console.log("Fetched notifications. Unread count:", unreadCount);
    };

    if (user?.id) {
      fetchNotifications(user.id);

      const notificationChannel = supabase
        .channel("public:notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            if (!newNotification.is_read) {
              setUnreadNotificationsCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationChannel);
      };
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!supabase) return;

    isMounted.current = true;

    const getUserData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        if (isMounted.current) {
          const { error: collaborationsError } = await supabase
            .from("collaborations")
            .select(
              "*, inviter:inviter_id(id, email, first_name, last_name, avatar_url), invitee:invitee_id(id, email, first_name, last_name, avatar_url)"
            )
            .or(`inviter_id.eq.${authUser.id},invitee_id.eq.${authUser.id}`);

          if (collaborationsError) {
            console.error(
              "Error fetching collaborations:",
              collaborationsError
            );
          }
          // Collaborators are now managed by DataContext, no need to process here
        }
      } else {
        navigate("/login");
      }
    };

    getUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          if (isMounted.current) {
            navigate("/");
          }
        } else if (session) {
          if (isMounted.current) {
            // User data handled by DataContext
          }
        }
      }
    );

    return () => {
      isMounted.current = false;
      authListener.subscription.unsubscribe();
    };
  }, [navigate, user, supabase]);

  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      sessionStorage.removeItem("adminPromptShown"); // Clear session storage on logout
      toast.success("Déconnexion réussie.");
      navigate("/");
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (user && supabase) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        toast.error(
          "Erreur lors du marquage de toutes les notifications comme lues."
        );
      }
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      setUnreadNotificationsCount(0);
    }
  };

  const handleNotificationClick = async (
    notification: Notification,
    markAsReadOnly: boolean = false
  ) => {
    if (!user || !supabase) return;

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id);

    if (updateError) {
      console.error("Error marking notification as read:", updateError);
      toast.error("Erreur lors du marquage de la notification comme lue.");
    }

    setNotifications((prev) => {
      const updatedNotifications = prev.map((notif) =>
        notif.id === notification.id ? { ...notif, is_read: true } : notif
      );
      console.log("Notifications after marking as read:", updatedNotifications);
      return updatedNotifications;
    });
    setUnreadNotificationsCount((prevCount) => Math.max(0, prevCount - 1));

    if (!markAsReadOnly) {
      if (
        notification.type === "collaboration_invite" ||
        notification.type === "collaboration_accepted"
      ) {
        navigate("/dashboard/profile");
      } else if (notification.type === "credit_shared") {
        navigate("/dashboard/credits");
      } else if (notification.type === "recurring_charge_shared") {
        navigate("/dashboard/recurring-charges");
      } else if (notification.type === "savings_contribution_shared") {
        navigate("/dashboard/savings");
      }
    }
  };

  const userDisplayName: string =
    user?.user_metadata?.firstName && user?.user_metadata?.lastName
      ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
      : user?.email ?? ""; // Changed from "Chargement..." to empty string

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-64" : "w-20"
        } flex flex-col justify-between p-4 h-full`}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            {isSidebarOpen && (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">BudgetApp</h2>
                {isAdminDashboard && <Badge variant="destructive">Admin</Badge>}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white hover:bg-gray-700"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-gray-700"
              asChild
            >
              <Link to={isAdminDashboard ? "/admin-dashboard" : "/dashboard"}>
                <Home className="h-5 w-5 mr-2" />
                {isSidebarOpen && <span>Tableau de bord</span>}
              </Link>
            </Button>

            {isAdminDashboard && profile?.is_admin && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-gray-700"
                  asChild
                >
                  <Link to="/admin-dashboard/references">
                    <ListChecks className="h-5 w-5 mr-2" />
                    {isSidebarOpen && <span>Référentiels</span>}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-gray-700"
                  asChild
                >
                  <Link to="/admin-dashboard/users">
                    <User className="h-5 w-5 mr-2" />
                    {isSidebarOpen && <span>Utilisateurs</span>}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-gray-700"
                  asChild
                >
                  <Link to="/admin-dashboard/help">
                    <HelpCircle className="h-5 w-5 mr-2" />
                    {isSidebarOpen && <span>Aide</span>}
                  </Link>
                </Button>
              </>
            )}

            {!isAdminDashboard && (
              <Collapsible
                open={isBudgetExpanded}
                onOpenChange={setIsBudgetExpanded}
                className="space-y-1"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-gray-700"
                  >
                    <GalleryVerticalEndIcon className="h-5 w-5 mr-2" />
                    {isSidebarOpen && (
                      <span className="flex-1 text-left">Budget</span>
                    )}
                    {isSidebarOpen && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isBudgetExpanded ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out">
                  {isSidebarOpen && (
                    <>
                      <Button
                        variant="ghost"
                        asChild
                        className="w-full justify-start pl-8 text-white hover:bg-gray-700"
                      >
                        <Link to="/dashboard/incomes">
                          <div className="flex items-center">Revenus</div>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="w-full justify-start pl-8 text-white hover:bg-gray-700"
                      >
                        <Link to="/dashboard/credits">
                          <div className="flex items-center">Crédits</div>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="w-full justify-start pl-8 text-white hover:bg-gray-700"
                      >
                        <Link to="/dashboard/recurring-charges">
                          <div className="flex items-center">Charges</div>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start pl-8 text-white hover:bg-gray-700"
                        asChild
                      >
                        <Link to="/dashboard/savings">
                          {" "}
                          <div className="flex items-center">Épargne</div>
                        </Link>
                      </Button>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </nav>
        </div>

        {/* User Menu and Notifications */}
        <div className="mt-auto flex flex-col items-center space-y-2">
          {!isAdminDashboard && (
            <SidebarDisposableIncomeCard
              estimatedDisposableIncome={estimatedDisposableIncome}
              isSidebarOpen={isSidebarOpen}
            />
          )}
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative w-full justify-start text-white hover:bg-gray-700"
              >
                <div className="relative mr-2">
                  <Bell className="h-6 w-6" />
                  {unreadNotificationsCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0"
                    >
                      {unreadNotificationsCount}
                    </Badge>
                  )}
                </div>
                {isSidebarOpen && <span>Notifications</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 bg-white shadow-lg rounded-md p-2">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              {notifications.length > 0 && unreadNotificationsCount > 0 && (
                <DropdownMenuItem
                  onClick={markAllNotificationsAsRead}
                  className="text-blue-600 font-semibold cursor-pointer"
                >
                  <MailOpen className="mr-2 h-4 w-4" />
                  Marquer tout comme lu
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem className="text-gray-500">
                  Aucune nouvelle notification.
                </DropdownMenuItem>
              ) : (
                notifications
                  .filter((notif) => !notif.is_read)
                  .map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className="flex justify-between items-center"
                    >
                      <div
                        className="flex flex-col flex-grow cursor-pointer"
                        onClick={() => handleNotificationClick(notif, false)} // Pass false to prevent immediate navigation
                      >
                        <span className="font-semibold">{notif.message}</span>
                        <span className="text-xs text-gray-500">
                          Reçue{" "}
                          {formatDistanceToNow(parseISO(notif.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent dropdown from closing
                          handleNotificationClick(notif, true); // Pass true to mark as read and remove
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </DropdownMenuItem>
                  ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-700"
              >
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage
                    src={
                      (typeof user?.user_metadata?.avatar_url === "string" &&
                        user.user_metadata.avatar_url) ||
                      "https://github.com/shadcn.png"
                    }
                    alt="Avatar"
                  />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
                {isSidebarOpen && (
                  <span className="truncate">{userDisplayName}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white shadow-lg rounded-md p-2">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile">Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings">Paramètres</Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}

export default DashboardLayout;
