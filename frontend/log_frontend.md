chunk-WERSD76P.js?v=a34c22da:521 Warning: React has detected a change in the order of Hooks called by GamePage. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
1. useContext                 useContext
2. useContext                 useContext
3. useContext                 useContext
4. useEffect                  useEffect
5. useState                   useState
6. useCallback                useCallback
7. useSyncExternalStore       useSyncExternalStore
8. useEffect                  useEffect
9. useContext                 useContext
10. useContext                useContext
11. useContext                useContext
12. useEffect                 useEffect
13. useState                  useState
14. useCallback               useCallback
15. useSyncExternalStore      useSyncExternalStore
16. useEffect                 useEffect
17. useContext                useContext
18. useContext                useContext
19. useContext                useContext
20. useEffect                 useEffect
21. useState                  useState
22. useCallback               useCallback
23. useSyncExternalStore      useSyncExternalStore
24. useEffect                 useEffect
25. useContext                useContext
26. useContext                useContext
27. useContext                useContext
28. useEffect                 useEffect
29. useState                  useState
30. useCallback               useCallback
31. useSyncExternalStore      useSyncExternalStore
32. useEffect                 useEffect
33. useContext                useContext
34. useContext                useContext
35. useContext                useContext
36. useEffect                 useEffect
37. useState                  useState
38. useCallback               useCallback
39. useSyncExternalStore      useSyncExternalStore
40. useEffect                 useEffect
41. useContext                useContext
42. useContext                useContext
43. useState                  useState
44. useEffect                 useEffect
45. useCallback               useCallback
46. useSyncExternalStore      useSyncExternalStore
47. useCallback               useCallback
48. useContext                useContext
49. useContext                useContext
50. useContext                useContext
51. useEffect                 useEffect
52. useState                  useState
53. useCallback               useCallback
54. useSyncExternalStore      useSyncExternalStore
55. useEffect                 useEffect
56. useContext                useContext
57. useContext                useContext
58. useContext                useContext
59. useEffect                 useEffect
60. useState                  useState
61. useCallback               useCallback
62. useSyncExternalStore      useSyncExternalStore
63. useEffect                 useEffect
64. useContext                useContext
65. useContext                useContext
66. useState                  useState
67. useEffect                 useEffect
68. useCallback               useCallback
69. useSyncExternalStore      useSyncExternalStore
70. useCallback               useCallback
71. useContext                useContext
72. useContext                useContext
73. useState                  useState
74. useEffect                 useEffect
75. useCallback               useCallback
76. useSyncExternalStore      useSyncExternalStore
77. useCallback               useCallback
78. useContext                useContext
79. useState                  useState
80. useState                  useState
81. useState                  useState
82. useState                  useState
83. useRef                    useRef
84. useState                  useState
85. useRef                    useRef
86. useEffect                 useEffect
87. useEffect                 useEffect
88. undefined                 useMemo
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    at GamePage (http://localhost:5173/src/game/GamePage.tsx?t=1784296181442:42:16)
    at ProtectedRoute (http://localhost:5173/src/components/ProtectedRoute.tsx:20:34)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=a34c22da:4122:5)
    at Routes (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=a34c22da:4592:5)
    at Router (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=a34c22da:4535:15)
    at BrowserRouter (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=a34c22da:5273:5)
    at ToastProvider (http://localhost:5173/src/components/Toast.tsx:21:33)
    at AuthProvider (http://localhost:5173/src/context/AuthContext.tsx:26:32)
    at QueryClientProvider (http://localhost:5173/node_modules/.vite/deps/@tanstack_react-query.js?v=a34c22da:3239:3)
    at App

2
chunk-WERSD76P.js?v=a34c22da:11678 Uncaught Error: Rendered more hooks than during the previous render.
    at GamePage (GamePage.tsx:69:37)
chunk-WERSD76P.js?v=a34c22da:14032 The above error occurred in the <GamePage> component:

    at GamePage (http://localhost:5173/src/game/GamePage.tsx?t=1784296181442:42:16)
    at ProtectedRoute (http://localhost:5173/src/components/ProtectedRoute.tsx:20:34)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=a34c22da:4122:5)
    at Routes (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=a34c22da:4592:5)
    at Router (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=a34c22da:4535:15)
    at BrowserRouter (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=a34c22da:5273:5)
    at ToastProvider (http://localhost:5173/src/components/Toast.tsx:21:33)
    at AuthProvider (http://localhost:5173/src/context/AuthContext.tsx:26:32)
    at QueryClientProvider (http://localhost:5173/node_modules/.vite/deps/@tanstack_react-query.js?v=a34c22da:3239:3)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
chunk-WERSD76P.js?v=a34c22da:9129 Uncaught Error: Rendered more hooks than during the previous render.
    at GamePage (GamePage.tsx:69:37)