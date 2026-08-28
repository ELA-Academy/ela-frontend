import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import ParentSidebar from "./ParentSidebar";
import ParentHeader from "./ParentHeader";
import ParentBottomNav from "./ParentBottomNav";
import api from "../../utils/api";
import "../../styles/ParentPortal.css";

const ParentLayout = () => {
  const [childrenList, setChildrenList] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    api.get("/parent/me")
      .then((res) => {
        if (res.data && res.data.children) {
          setChildrenList(res.data.children);
          if (res.data.children.length > 0) {
            setActiveStudent(res.data.children[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load parent data:", err);
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }, []);

  return (
    <div className="parent-app-container">
      <ParentSidebar />
      
      <div className="parent-main">
        <ParentHeader
          activeStudent={activeStudent}
          onSelectStudent={setActiveStudent}
          childrenList={childrenList}
        />

        <main className="parent-content-pane">
          <Outlet context={{ activeStudent, setActiveStudent, childrenList }} />
        </main>

        <ParentBottomNav />
      </div>
    </div>
  );
};

export default ParentLayout;
