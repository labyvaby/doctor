import { Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { ThemedLayout, useNotificationProvider } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import "./styles/layout.css";

import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import dataProvider from "@refinedev/simple-rest";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Header, CustomSider } from "./components";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { LayoutProvider } from "./contexts/layout";
import {
  BlogPostCreate,
  BlogPostEdit,
  BlogPostList,
  BlogPostShow,
} from "./pages/blog-posts";
import {
  CategoryCreate,
  CategoryEdit,
  CategoryList,
  CategoryShow,
} from "./pages/categories";
import { NotFound } from "./pages/not-found";
import Home from "./pages/home";
// import { SubHeader } from "./components/subHeader";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider("https://api.fake-rest.refine.dev")}
                notificationProvider={useNotificationProvider()}
                routerProvider={routerProvider}
                resources={[
                  {
                    name: "home",
                    list: "/home",
                  },
                  {
                    name: "blog_posts",
                    list: "/blog-posts",
                    create: "/blog-posts/create",
                    edit: "/blog-posts/edit/:id",
                    show: "/blog-posts/show/:id",
                    meta: {
                      canDelete: true,
                    },
                  },
                  {
                    name: "categories",
                    list: "/categories",
                    create: "/categories/create",
                    edit: "/categories/edit/:id",
                    show: "/categories/show/:id",
                    meta: {
                      canDelete: true,
                    },
                  },
                ]}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  projectId: "D2lERL-DvNxNo-DvsQWW",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <LayoutProvider>
                        <ThemedLayout
                          Header={() => <Header sticky />}
                          Sider={(props) => <CustomSider {...props} />}
                        >
                          <Outlet />
                        </ThemedLayout>
                      </LayoutProvider>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="home" />}
                    />
                    <Route path="/home" element={<Home />} />
                    <Route path="/blog-posts">
                      <Route index element={<BlogPostList />} />
                      <Route path="create" element={<BlogPostCreate />} />
                      <Route path="edit/:id" element={<BlogPostEdit />} />
                      <Route path="show/:id" element={<BlogPostShow />} />
                    </Route>
                    <Route path="/categories">
                      <Route index element={<CategoryList />} />
                      <Route path="create" element={<CategoryCreate />} />
                      <Route path="edit/:id" element={<CategoryEdit />} />
                      <Route path="show/:id" element={<CategoryShow />} />
                    </Route>
                    <Route path="search" element={<NotFound />} />
                    <Route path="costs" element={<NotFound />} />
                    <Route path="doctors" element={<NotFound />} />
                    <Route path="products" element={<NotFound />} />
                    <Route path="sales" element={<NotFound />} />
                    <Route path="warehouse" element={<NotFound />} />
                    <Route path="blacklist" element={<NotFound />} />
                    <Route path="diagnostics" element={<NotFound />} />
                    <Route path="about" element={<NotFound />} />
                    <Route path="apps" element={<NotFound />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>

                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
