---
layout: post
title:  "Sailboat Hydrostatics Library"
date:   2026-9-17
tags:
  - coding
  - projects
  - fun
galleries:
 # gallery number one
 1:
   # row one in gallery one
    -
      - { url: '/static-files/posts/2026-09-17-hydrostatics/example-hull.jpg', alt='Plot of hull slice'}
      - { url: '/static-files/posts/2026-09-17-hydrostatics/example-stability.jpg', alt='Plot of stability curves'}
---
[![View on GitHub](https://img.shields.io/badge/GitHub-View%20repository-181717?logo=github&logoColor=white)](https://github.com/QuarkyGirl/hydrostatics)
[![Documentation](https://img.shields.io/badge/docs-GitHub_Pages-blue)](https://www.nellhall.com/hydrostatics)

Thought I'd post a fun work-in progress project I wrote up last year. ``hydrostatics`` is a little Python package mostly based on Gmsh that allows for sailboat hydrostatics and stability calculations.

{% include gallery.html  gallery=1 %}

I wrote this package because DELFTship doesn't do inclined hydrostatics, and for sailboat design that's absolutely essential. Right now the core functionality allows you to import an STL file, solve for the neutral waterline for a given displacement and heel, and from there calculate properties like the righting moment vs angle (a.k.a stability curves), volume, center of buoyancy, etc.

In lay terms, the stability curves tell you how much force is required to heel a boat to a given angle... and even more importantly, how much the boat will push back to upright at that angle. Inclined hydrostatics are also essential because, unlike with big container ships that mostly chug along totally upright, sailboats sail at significant angles of heel for significant periods of time (basically all the time upwind in more than a couple knots). Which is to say, if you only look at performance when totally upright, you're missing a pretty big part of the real-world picture.

The first image above shows an example of a solved waterplane for a given heel angle; the second shows stability curves for a variety of displacements and heel angles, all at neutral trim.

Future functionalities I'm planning to build in once I have a little more time are:
- Form coefficients (prismatic, block, etc.)
- Station areas
- Waterplane characteristics

The package is now live on [GitHub](https://github.com/QuarkyGirl/hydrostatics) with [documentation](https://www.nellhall.com/hydrostatics) hosted here on my website. Check it out!