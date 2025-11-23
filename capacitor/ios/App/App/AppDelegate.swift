import UIKit
import Capacitor
import FirebaseCore

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        // Initialize Firebase
        FirebaseApp.configure()

        return true
    }

    // Required for Capacitor deep linking
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    // Required for Capacitor universal links
    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
//
//import UIKit
//import Capacitor
//
//import FirebaseCore
//import FirebaseAuth
//import FirebaseMessaging
//import UserNotifications
//import Network
//
//@UIApplicationMain
//class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate, UNUserNotificationCenterDelegate {
//
//    var window: UIWindow?
//
//    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
//        // Override point for customization after application launch.
//
//        // Initialize Firebase
//        FirebaseApp.configure()
//
//        // Configure Firebase Messaging
//        Messaging.messaging().delegate = self
//
//        // Request notification permissions
//        UNUserNotificationCenter.current().delegate = self
//        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
//        UNUserNotificationCenter.current().requestAuthorization(
//            options: authOptions,
//            completionHandler: { _, _ in }
//        )
//        application.registerForRemoteNotifications()
//
//       
//
//
//        return true
//    }
//
//    func applicationWillResignActive(_ application: UIApplication) {
//        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
//        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
//    }
//
//    func applicationDidEnterBackground(_ application: UIApplication) {
//        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
//        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
//    }
//
//    func applicationWillEnterForeground(_ application: UIApplication) {
//        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
//    }
//
//    func applicationDidBecomeActive(_ application: UIApplication) {
//        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
//    }
//
//    func applicationWillTerminate(_ application: UIApplication) {
//        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
//    }
//
////    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
////        // Called when the app was launched with a url. Feel free to add additional processing here,
////        // but if you want the App API to support tracking app url opens, make sure to keep this call
////
////        // // Handle Facebook URL
////        if ApplicationDelegate.shared.application(app, open: url, options: options) {
////            return true
////        }
////        if Auth.auth().canHandle(url) {
////             return true
////        }
////        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
////    }
//
//    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
//        // Called when the app was launched with an activity, including Universal Links.
//        // Feel free to add additional processing here, but if you want the App API to support
//        // tracking app url opens, make sure to keep this call
//        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
//    }
//
//    // MARK: - Firebase Messaging Delegate
//    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
//        print("🔥 Firebase registration token: \(fcmToken ?? "nil")")
//
//        let dataDict: [String: String] = ["token": fcmToken ?? ""]
//        NotificationCenter.default.post(
//            name: Notification.Name("FCMToken"),
//            object: nil,
//            userInfo: dataDict
//        )
//    }
//
//    // MARK: - Remote Notifications
//    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
//        print("📱 APNs device token: \(deviceToken)")
//        Messaging.messaging().apnsToken = deviceToken
//    }
//
//    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
//        print("❌ Failed to register for remote notifications: \(error)")
//    }
//
//    // MARK: - UNUserNotificationCenterDelegate
//    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
//        completionHandler([[.alert, .sound]])
//    }
//
//    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
//        completionHandler()
//    }
//
//   
//
//    func setupMainViewController() {
//        // Load the main storyboard and set the root view controller
//        let storyboard = UIStoryboard(name: "Main", bundle: nil)
//        if let mainViewController = storyboard.instantiateInitialViewController() {
//            window?.rootViewController = mainViewController
//            window?.makeKeyAndVisible()
//        }
//    }
//
//   
//    private func isInternetAvailable() -> Bool {
//        let monitor = NWPathMonitor()
//        var isConnected = false
//        let semaphore = DispatchSemaphore(value: 0)
//
//        monitor.pathUpdateHandler = { path in
//            isConnected = path.status == .satisfied
//            semaphore.signal()
//        }
//
//        let queue = DispatchQueue(label: "NetworkCheck")
//        monitor.start(queue: queue)
//
//        _ = semaphore.wait(timeout: .now() + 1.0)
//        monitor.cancel()
//
//        return isConnected
//    }
//
//}
